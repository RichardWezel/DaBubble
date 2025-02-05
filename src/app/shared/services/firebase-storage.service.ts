import { inject, Injectable, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, addDoc, onSnapshot, setDoc, updateDoc, getDocs } from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { PostInterface } from '../interfaces/post.interface';
import { CurrentUserInterface } from '../interfaces/current-user-interface';
import { UidService } from './uid.service';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageHelperService } from './storage-helper.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService implements OnDestroy {
  firestore: Firestore = inject(Firestore);
  uid = inject(UidService);
  storageHelper = inject(StorageHelperService);
  user: UserInterface[] = [];
  channel: ChannelInterface[] = [];
  CurrentUserChannel: ChannelInterface[] = [];
  currentUser: CurrentUserInterface = { type: 'user', name: '', email: '', avatar: '', online: false, dm: [], id: '' };
  profileId: string = '';
  authUid: string = '';
  doneLoading: boolean = true;
  lastCreatedChannel: string = '';

  private userSubject: BehaviorSubject<UserInterface[]> = new BehaviorSubject<UserInterface[]>([]);
  public users$: Observable<UserInterface[]> = this.userSubject.asObservable();

  unsubUsers: () => void = () => { };
  unsubChannels: () => void = () => { };

  /**
   * Initializes the service by subscribing to channel and user collections
   * and fetching the current user.
  */
  constructor() {
    this.unsubChannels = this.getChannelCollection();
    this.unsubUsers = this.getUserCollection();
  }


  /**
 * Cleans up all active subscriptions when the service is destroyed.
 */
  ngOnDestroy(): void {
    this.unsubUsers();
    this.unsubChannels();
  }


  /**
   * Retrieves all threads the user is currently in. This function goes through all the channels the user is in and
   * all the direct messages the user has and aggregates all the thread messages into a single array of objects.
   * Each object contains the thread message and the parent channel or user object.
   * 
   * @returns An array of objects with the thread message and the parent channel or user.
   */
  getAllThreads(): { thread: PostInterface, parent: ChannelInterface | UserInterface }[] {
    const threads: { thread: PostInterface, parent: ChannelInterface | UserInterface }[] = [];
    const userChannel = this.channel.filter(channel => channel.user.includes(this.authUid));
    const user = this.user.find(user => user.id === this.authUid);
    threads.push(...this.storageHelper.getThreadsFromChannels(userChannel));
    threads.push(...this.storageHelper.getThreadsFromDirectMessages(user?.dm, this.currentUser));
    return threads;
  }


  /**
   * Funktion, um die Parent-Post-ID für einen gegebenen Channel und Thread zu finden.
   * @param channelId - Die ID des Channels.
   * @param threadId - Die ID des Threads.
   * @returns Die ID des übergeordneten Posts oder undefined, wenn nicht gefunden.
   */
  findParentPostId(channelId: string, threadId: string): string | undefined {
    const targetChannel = this.CurrentUserChannel.find(channel => channel.id === channelId);
    if (!targetChannel) {
      console.error(`Channel mit ID ${channelId} nicht gefunden.`);
      return undefined;
    }
    for (const post of targetChannel?.posts!) {
      if (post.threadMsg && post.threadMsg.length > 0) {
        const foundThread = post.threadMsg.find(threadPost => threadPost.id === threadId);
        if (foundThread) return post.id;
      }
    }
    console.warn(`Thread mit ID ${threadId} im Channel ${channelId} nicht gefunden.`);
    return undefined;
  }


  /**
   * Subscribes to the "channel" collection in Firestore and updates the local channel array.
   * @returns A function to unsubscribe from the snapshot listener.
   */
  getChannelCollection() {
    return onSnapshot(collection(this.firestore, "channel"), (snapshot) => {
      this.channel = [];
      snapshot.forEach((doc) => {
        const channelData = doc.data() as ChannelInterface;
        channelData.id = doc.id;
        this.channel.push(channelData);
      });
    });
  }


  /**
   * Iterates over the channel collection and removes users from channels that are no longer existing in the user collection.
   * This is a safety feature to ensure that deleted users are removed from all channels.
   * @returns A Promise that resolves when all channels have been processed.
   */
  async removeUsersFromChannels(): Promise<void> {
    const { user: currentUsers, channel } = this;
    const currentUserIds = new Set(currentUsers.map(u => u.id));
    for (const channel of this.channel) {
      const filteredUserIds = channel.user.filter(id => currentUserIds.has(id));
      if (filteredUserIds.length === channel.user.length || !channel.id) continue;
      try {
        await updateDoc(doc(this.firestore, "channel", channel.id), { user: filteredUserIds });
        channel.user = filteredUserIds;
      } catch (error) {
        console.error("Channel Update fehlgeschlagen:", channel.id, error);
      }
    }
  }


  /**
   * Filters the channel collection according to which channel contains the current user and uses it to fill currentUserChannel.
   * 
   * @returns 
   */
  async getCurrentUserChannelCollection() {
    this.CurrentUserChannel = this.channel.filter(channel =>
      this.checkCurrentUserIsMemberOfChannel(channel.user)
    );
    await this.removeUsersFromChannels();
    this.doneLoading = true;
  }


  /**
   * Checks if the current user is a member of the given channel.
   * @param users - An array of user IDs representing the members of the channel.
   * @returns - 'true' if the current user's ID is included in the 'users' array, otherwise 'false'.
   */
  checkCurrentUserIsMemberOfChannel(users: string[]) {
    return users.includes(this.currentUser.id || '');
  }


  /**
   * Subscribes to the "user" collection in Firestore and updates the local user array.
   * @returns A function to unsubscribe from the snapshot listener.
   */
  getUserCollection() {
    return onSnapshot(collection(this.firestore, "user"), (snapshot) => {
      this.user = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as UserInterface;
        userData.id = doc.id;
        this.user.push(userData);
      });
      this.userSubject.next(this.user);
    });
  }


  /**
  * Determines the current channel for the user based on session storage, channels, or DMs.
  * @param userData - The current user's data.
  * @returns The ID of the current channel or undefined if none found.
  */
  determineCurrentChannel(userData: CurrentUserInterface): string | undefined {
    const sessionChannel = sessionStorage.getItem("currentChannel");
    if (sessionChannel) return sessionChannel;
    if (userData.id) {
      const channelId = this.findUserChannel(userData.id);
      if (channelId) {
        sessionStorage.setItem("currentChannel", channelId);
        return channelId;
      }
      return this.findUserDm(userData);
    }
    return undefined;
  }


  /**
   * Finds a channel that includes the specified user ID.
   * @param userId - The ID of the user to search for in channels.
   * @returns The ID of the found channel or undefined if not found.
   */
  private findUserChannel(userId: string): string | undefined {
    const channel = this.channel.find(channel => channel.user.includes(userId));
    return channel?.id;
  }


  /**
  * Finds a direct message (DM) that includes the specified user ID as a contact.
  * @param userData - The current user's data.
  * @returns The ID of the found DM or undefined if not found.
  */
  private findUserDm(userData: CurrentUserInterface): string | undefined {
    const dm = userData.dm.find(dm => dm.contact === userData.id);
    sessionStorage.setItem("currentChannel", dm?.id || '');
    return dm?.id;
  }


  /**
   * Adds a new user to the Firestore "user" collection after Firebase Auth registration.
   * @param authUid - The authenticated user's UID.
   * @param userData - An object containing the user's name, email, and avatar.
   */
  async addUser(authUid: string, userData: { name: string, email: string, avatar: string }) {
    await setDoc(doc(this.firestore, "user", authUid), this.storageHelper.generateUser(authUid, userData, this.uid.generateUid()));
  }


  /**
  * Adds a new channel to the Firestore "channel" collection after sending the new channel form.
  * @param channelData - An object containing the channel's name, description, and owner.
  */
  async addChannel(channelData: { name: string, description: string, owner: string }) {
    try {
      const channelsCollection = collection(this.firestore, "channel");
      const docRef = await addDoc(channelsCollection, this.storageHelper.generateChannel(channelData));
      this.lastCreatedChannel = docRef.id;
      return docRef;
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Channels: ", error);
      throw error;
    }
  }


  /**
    * Updates an existing user's profile in the Firestore "user" collection after sending the edit user profile form.
    * @param userId - The ID of the user to update.
    * @param userData - An object containing the updated user data.
    */
  async updateUser(userId: string, userData: Partial<UserInterface>) {
    await updateDoc(doc(this.firestore, "user", userId), userData);
  }


  /**
   * Updates an existing channel in the Firestore "channel" collection after sending the edit channel form.
   * @param channelId - The ID of the channel to update.
   * @param channelData - An object containing the updated channel data.
   */
  async updateChannel(channelId: string, channelData: Partial<ChannelInterface>) {
    try {
      const validData = Object.fromEntries(
        Object.entries(channelData).filter(([_, value]) => value !== undefined)
      );
      await updateDoc(doc(this.firestore, "channel", channelId), validData);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Channels:", error);
      throw error;
    }
  }


  /**
  * Überprüft, ob ein bestimmter Benutzer online ist, basierend auf den lokal gespeicherten Benutzerdaten.
  * @param userId - Die ID des Benutzers, der überprüft werden soll.
  * @returns `true` wenn der Benutzer online ist, `false` ansonsten.
  */
  isUserOnline(userId: string): boolean {
    const user = this.user.find(u => u.id === userId);
    return user ? user.online : false;
  }


  /**
   * Writes a direct message (DM) post for a user and updates the Firestore "user" collection.
   * @param userId - The ID of the user sending the DM.
   * @param contact - The ID of the contact receiving the DM.
   * @param newPost - The new post to add to the DM.
   */
  async writeDm(userId: string, contact: string, newPost: PostInterface) {
    let sendUser = this.user[this.user.findIndex(user => user.id === userId)];
    let newDm = sendUser.dm ? sendUser.dm[sendUser.dm.findIndex(dm => dm.contact === contact)] : null;
    if (newDm) {
      newDm.posts.push(newPost);
    } else {
      if (!sendUser.dm) sendUser.dm = [this.storageHelper.generateDM(contact, this.uid.generateUid(), newPost)];
      else sendUser.dm.push(this.storageHelper.generateDM(contact, this.uid.generateUid(), newPost));
    }
    await updateDoc(doc(this.firestore, "user", userId), {
      dm: sendUser.dm
    });
  };


  /**
   * Creates a new empty direct message (DM) for a user and updates the Firestore "user" collection.
   * @param contact - The ID of the contact receiving the DM.
   */
  async createNewEmptyDm(user1: string, contact: string) {
    let sendUser = this.user[this.user.findIndex(user => user.id === user1)];
    if (!sendUser.dm) sendUser.dm = [this.storageHelper.generateDM(contact, this.uid.generateUid())];
    else sendUser.dm.push(this.storageHelper.generateDM(contact, this.uid.generateUid()));
    await updateDoc(doc(this.firestore, "user", user1), {
      dm: sendUser.dm
    });
  }


  /**
   * Writes a new post to a channel and updates the Firestore "channel" collection.
   * @param channelId - The ID of the channel to add the post to.
   * @param newPost - The new post to add.
   */
  async writePosts(channelId: string, newPost: PostInterface) {
    let currentChannel = this.channel[this.channel.findIndex(channel => channel.id === channelId)];
    if (currentChannel) {
      await updateDoc(doc(this.firestore, "channel", channelId), {
        posts: [
          ...currentChannel.posts ?? [],
          newPost
        ]
      });
    };
  }


  /**
   * Updates a specific post within a channel in the Firestore "channel" collection.
   * 
   * @param channelId - The ID of the channel containing the post to update.
   * @param postId - The ID of the post to update.
   * @param newPost - The new post data to update the existing post.
   */
  async updateChannelPost(channelId: string, postId: string, newPost: PostInterface) {
    let currentChannel = this.channel[this.channel.findIndex(channel => channel.id === channelId)];
    if (currentChannel) {
      let post = currentChannel.posts?.find(post => post.id === postId);
      if (post) {
        post = this.storageHelper.generatePost(post, newPost);
        await updateDoc(doc(this.firestore, "channel", channelId,), {
          posts: currentChannel.posts
        })
      }
    };
  }


  /**
   * Updates a specific direct message (DM) post for a user in the Firestore "user" collection.
   * 
   * @param userId - The ID of the user whose DM post is to be updated.
   * @param contact - The ID of the contact associated with the DM.
   * @param postId - The ID of the post to be updated within the DM.
   * @param newPost - The new post data to update the existing post.
   */
  async updateDmPost(userId: string, contact: string, postId: string, newPost: PostInterface) {
    let sendUser = this.user[this.user.findIndex(user => user.id === userId)];
    let newDm = sendUser.dm ? sendUser.dm[sendUser.dm.findIndex(dm => dm.contact === contact)] : null;
    if (newDm) {
      let post = newDm.posts.find(post => post.id === postId);
      if (post) {
        post = this.storageHelper.generatePost(post, newPost);
        await updateDoc(doc(this.firestore, "user", userId), {
          dm: sendUser.dm
        })
      }
    }
  }


  /**
   * Fügt mehrere Benutzer zu einem Channel hinzu.
   * @param channelId - Die ID des Channels.
   * @param newUserIds - Ein Array von Benutzer-IDs, die hinzugefügt werden sollen.
   */
  async addUsersToChannel(channelId: string, newUserIds: string[]): Promise<void> {
    try {
      const channelDocRef = doc(this.firestore, "channel", channelId);
      await updateDoc(channelDocRef, {
        user: arrayUnion(...newUserIds)
      });
    } catch (error) {
      console.error(`Fehler beim Hinzufügen von Benutzern zum Channel "${channelId}":`, error);
      throw error;
    }
  }


  /**
   * Checks if a channel with the given name already exists, excluding the channel with the given ID.
   * @param channelId - The ID of the channel to exclude from the search.
   * @param newName - The name to check for existence.
   * @returns A promise that resolves to true if a channel with the given name exists, false otherwise.
   */
  async channelNameExists(channelId: string, newName: string): Promise<boolean> {
    const channels = this.channel.filter(channel => channel.id !== channelId);
    const channelNames = channels.map(channel => channel.name.toLowerCase());
    return channelNames.includes(newName.toLowerCase());
  }
}