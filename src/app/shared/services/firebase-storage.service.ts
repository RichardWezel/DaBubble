import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { PostInterface } from '../interfaces/post.interface';
import { CurrentUserInterface } from '../interfaces/current-user-interface';
import { UidService } from './uid.service';
import { OnlineStatusService } from '../services/online-status.service';
import { Auth } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  firestore: Firestore = inject(Firestore);
  uid = inject(UidService);
  onlineStatusService = inject(OnlineStatusService);
  auth: Auth = inject(Auth);

  user: UserInterface[] = [];
  channel: ChannelInterface[] = [];
  currentUser: CurrentUserInterface = { name: '', email: '', avatar: '', online: false, dm: [], id: '' };
  authUid = sessionStorage.getItem("authUid") || 'oYhCXFUTy11sm1uKLK4l';

  unsubUsers: () => void = () => { };
  unsubChannels: () => void = () => { };
  unsubscribeSnapshot: () => void = () => { };

  /**
   * Initializes the service by subscribing to channel and user collections
   * and fetching the current user.
   */
  constructor() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Benutzer ist angemeldet:', user);
        this.getCurrentUser(user); // Benutzer an `getCurrentUser` übergeben
      } else {
        console.log('Kein Benutzer ist angemeldet.');
        this.clearCurrentUser(); // Lokale Benutzerdaten zurücksetzen
      }
    });
  
    this.unsubChannels = this.getChannelCollection();
    this.unsubUsers = this.getUserCollection();
  }

  clearCurrentUser() {
    this.currentUser = {
      name: '',
      email: '',
      avatar: '',
      online: false,
      dm: [],
      id: '',
    };
    console.log('Lokale Benutzerdaten wurden zurückgesetzt.');
  }

  guestLogin() {
    this.clearCurrentUser(); // Lokale Daten zurücksetzen
    
  
    console.log('Gast-Login erfolgreich. Benutzer:', this.currentUser);
  }

  /**
   * Cleans up all active subscriptions when the service is destroyed.
   */
  ngOnDestroy(): void {
    this.unsubUsers();
    this.unsubChannels();
    this.unsubscribeSnapshot();
    if (this.currentUser.id) {
      this.onlineStatusService.setUserOnlineStatus(this.currentUser.id, false)
        .then(() => console.log(`User ${this.currentUser.id} set to offline.`))
        .catch(error => console.error(`Error setting user ${this.currentUser.id} offline:`, error));
    }
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
       console.log("Channel Collection: ", this.channel)
    });
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
       console.log("User Collection: ", this.user);
    });
  }

  /**
   * Subscribes to the current user's document in Firestore and updates the currentUser object.
   */
  getCurrentUser(user?: any) {
    user = user || this.auth.currentUser; 
  
    if (!user) {
      console.error('Kein authentifizierter Benutzer gefunden.');
      return;
    }
  
    const userDocRef = doc(this.firestore, 'user', user.uid);
    this.unsubscribeSnapshot = onSnapshot(userDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.error('Benutzer nicht in Firestore gefunden.');
        return;
      }
  
      let userData = this.extractUserData(snapshot);
      userData.currentChannel = this.determineCurrentChannel(userData);
      userData.threadOpen = this.currentUser.threadOpen || false;
      userData.postId = this.currentUser.postId || '';
      this.currentUser = userData;
  
      if (this.currentUser.id) {
        try {
          await this.onlineStatusService.setUserOnlineStatus(this.currentUser.id, true);
          console.log(`Benutzer ${this.currentUser.id} ist online.`);
        } catch (error) {
          console.error(`Fehler beim Setzen des Online-Status für ${this.currentUser.id}:`, error);
        }
      }
    }, (error) => {
      console.error('Fehler beim Abrufen des Benutzer-Snapshots:', error);
    });
  } 
  
  

  /**
   * Extracts user data from a Firestore snapshot and assigns the document ID.
   * @param snapshot - The Firestore document snapshot.
   * @returns The extracted user data as a CurrentUserInterface object.
   */
  private extractUserData(snapshot: any): CurrentUserInterface {
    let userData = snapshot.data() as CurrentUserInterface;
    userData.id = snapshot.id;
    return userData;
  }

  /**
  * Determines the current channel for the user based on session storage, channels, or DMs.
  * @param userData - The current user's data.
  * @returns The ID of the current channel or undefined if none found.
  */
  private determineCurrentChannel(userData: CurrentUserInterface): string | undefined {
    const sessionChannel = sessionStorage.getItem("currentChannel");

    if (sessionChannel) {
      return sessionChannel;
    }

    if (userData.id) {
      const channelId = this.findUserChannel(userData.id);
      if (channelId) {
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
    return dm?.id;
  }

  /**
   * Sets the current channel for the user and stores it in session storage.
   * @param channelId - The ID of the channel to set as current.
   */
  setChannel(channelId: string) {
    this.currentUser.currentChannel = channelId;
    this.currentUser.threadOpen = false;
    sessionStorage.setItem("currentChannel", channelId);
    console.log("Current Channel of User: ", this.currentUser.currentChannel)
  }

  /**
   * Adds a new user to the Firestore "user" collection after Firebase Auth registration.
   * @param authUid - The authenticated user's UID.
   * @param userData - An object containing the user's name, email, and avatar.
   */
  async addUser(authUid: string, userData: { name: string, email: string, avatar: string }) {
    await setDoc(doc(this.firestore, "user", authUid), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      online: false,
      dm: [{
        contact: authUid,
        id: this.uid.generateUid(),
        posts: [],
      },],
    } as UserInterface);
  }

  /**
  * Adds a new channel to the Firestore "channel" collection after sending the new channel form.
  * @param channelData - An object containing the channel's name, description, and owner.
  */
  async addChannel(channelData: { name: string, description: string, owner: string }) {
    await setDoc(doc(this.firestore, "channel"), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: [channelData.owner],
      posts: [],
    } as ChannelInterface);
  }


  /**
   * Updates an existing user's profile in the Firestore "user" collection after sending the edit user profile form.
   * @param userId - The ID of the user to update.
   * @param userData - An object containing the updated user data.
   */
  async updateUser(userId: string, userData: UserInterface) {
    await updateDoc(doc(this.firestore, "user", userId), {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      online: userData.online,
      dm: userData.dm
    })
  }


  /**
   * Updates an existing channel in the Firestore "channel" collection after sending the edit channel form.
   * @param channelId - The ID of the channel to update.
   * @param channelData - An object containing the updated channel data.
   */
  async updateChannel(channelId: string, channelData: ChannelInterface) {
    await updateDoc(doc(this.firestore, "channel", channelId), {
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: channelData.user,
      posts: channelData.posts,
    })
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
      sendUser.dm = [];
      sendUser.dm.push({
        contact: contact,
        id: this.uid.generateUid(),
        posts: [newPost],
      });
    }
    await updateDoc(doc(this.firestore, "user", userId), {
      dm: sendUser.dm
    });
  };

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

  async updateChannelPost(channelId: string, postId: string, newPost: PostInterface) {
    let currentChannel = this.channel[this.channel.findIndex(channel => channel.id === channelId)];
    if (currentChannel) {
      let post = currentChannel.posts?.find(post => post.id === postId);
      if (post) {
        post.text = newPost.text;
        post.emoticons = newPost.emoticons;
        post.threadMsg = newPost.threadMsg;
        post.thread = newPost.thread;
        await updateDoc(doc(this.firestore, "channel", channelId,), {
          posts: currentChannel.posts
        })
      }
    };
  }


  async updateDmPost(userId: string, contact: string, postId: string, newPost: PostInterface) {
    let sendUser = this.user[this.user.findIndex(user => user.id === userId)];
    let newDm = sendUser.dm ? sendUser.dm[sendUser.dm.findIndex(dm => dm.contact === contact)] : null;
    if (newDm) {
      let post = newDm.posts.find(post => post.id === postId);
      if (post) {
        post.text = newPost.text;
        post.emoticons = newPost.emoticons;
        post.threadMsg = newPost.threadMsg;
        post.thread = newPost.thread;
        await updateDoc(doc(this.firestore, "user", userId), {
          dm: sendUser.dm
        })
      }
    }
  }

}