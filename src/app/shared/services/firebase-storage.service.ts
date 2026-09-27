import { inject, Injectable, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection, collectionGroup, doc, addDoc, onSnapshot, setDoc, updateDoc,
  getDoc, getDocs, query, where, orderBy, increment, arrayUnion, Timestamp
} from "firebase/firestore";
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { DmInterface } from '../interfaces/dm.interface';
import { PostInterface } from '../interfaces/post.interface';
import { EmoticonsInterface } from '../interfaces/emoticons.interface';
import { CurrentUserInterface } from '../interfaces/current-user-interface';
import { UidService } from './uid.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageHelperService } from './storage-helper.service';

/** How long a post written by a visitor survives before the TTL policy removes it. */
const VISITOR_POST_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Fixed document id of the welcome message; the rules key their exemption on it. */
const WELCOME_POST_ID = 'welcome';

export type ConversationType = 'channel' | 'dm';

/** A thread reply found by search, together with where it lives. */
export interface ThreadSearchHit {
  thread: PostInterface;
  parentType: ConversationType;
  conversationId: string;
  parentPostId: string;
}

/** A channel message found by search, together with its channel. */
export interface ChannelPostSearchHit {
  post: PostInterface;
  channel: ChannelInterface;
}

/**
 * Everything search can look through. Firestore has no "contains" query, so
 * matching happens in memory - which means the messages have to be fetched
 * first. They are no longer loaded on page load, so this is built on the
 * first keystroke in the search field and reused until something is written.
 */
export interface SearchIndex {
  channelPosts: ChannelPostSearchHit[];
  threads: ThreadSearchHit[];
}

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

  /** Direct message conversations the current user takes part in. */
  dms: DmInterface[] = [];
  /** Messages of the conversation that is currently open. */
  posts: PostInterface[] = [];
  /** Replies of the thread that is currently open. */
  threadPosts: PostInterface[] = [];

  currentUser: CurrentUserInterface = { type: 'user', name: '', email: '', avatar: '', online: false, id: '' };
  profileId: string = '';
  authUid: string = '';
  doneLoading: boolean = true;
  lastCreatedChannel: string = '';

  private userSubject: BehaviorSubject<UserInterface[]> = new BehaviorSubject<UserInterface[]>([]);
  public users$: Observable<UserInterface[]> = this.userSubject.asObservable();

  /** Cached search index; null until the first search, dropped on every write. */
  private searchIndex: Promise<SearchIndex> | null = null;

  /** Resolves once the channel collection has arrived for the first time. */
  channelsReady: Promise<void>;
  private markChannelsReady: () => void = () => { };

  unsubUsers: () => void = () => { };
  unsubChannels: () => void = () => { };
  unsubDms: () => void = () => { };
  unsubPosts: () => void = () => { };
  unsubThread: () => void = () => { };

  /**
   * Subscribes to the collections that are needed globally. Posts and thread
   * replies are subscribed to on demand, see openConversation/openThread.
   */
  constructor() {
    this.channelsReady = new Promise<void>((resolve) => { this.markChannelsReady = resolve; });
    this.unsubChannels = this.getChannelCollection();
    this.unsubUsers = this.getUserCollection();
  }


  /**
   * Cleans up all active subscriptions when the service is destroyed.
   */
  ngOnDestroy(): void {
    this.unsubUsers();
    this.unsubChannels();
    this.unsubDms();
    this.unsubPosts();
    this.unsubThread();
  }


  // ---------------------------------------------------------------- paths

  /**
   * Builds the id of the conversation between two users. Sorting makes it the
   * same id no matter who opens it; a conversation with yourself passes the
   * same id twice.
   * @param userA - one participant
   * @param userB - the other participant
   */
  buildDmId(userA: string, userB: string): string {
    return [userA, userB].sort().join('_');
  }


  /**
   * The two collections share one document layout, so most operations only
   * need to know the parent path.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   */
  conversationPath(type: ConversationType, id: string): string {
    return `${type}/${id}`;
  }


  /**
   * Whether the currently open conversation is a channel, a direct message,
   * the "new message" screen, or nothing yet.
   */
  get currentConversationType(): ConversationType | 'newMessage' | '' {
    const id = this.currentUser.currentChannel;
    if (id && this.channel.some(channel => channel.id === id)) return 'channel';
    if (id && this.dms.some(dm => dm.id === id)) return 'dm';
    if (sessionStorage.getItem('currentChannel') === 'newMessage') return 'newMessage';
    return '';
  }


  /** Path of the conversation that is currently open, or null if none is. */
  get currentConversationPath(): string | null {
    const type = this.currentConversationType;
    if (type !== 'channel' && type !== 'dm') return null;
    return this.conversationPath(type, this.currentUser.currentChannel!);
  }


  /**
   * The other participant of a direct message. For a conversation with
   * yourself that is the current user.
   * @param dmId - the conversation id
   */
  dmContact(dmId: string | undefined): string {
    const dm = this.dms.find(entry => entry.id === dmId);
    if (!dm) return '';
    return dm.participants.find(participant => participant !== this.currentUser.id) ?? this.currentUser.id ?? '';
  }


  // --------------------------------------------------------- subscriptions

  /**
   * Subscribes to the "channel" collection. Only channel metadata - the
   * messages live in the posts subcollection.
   * @returns A function to unsubscribe from the snapshot listener.
   */
  getChannelCollection() {
    return onSnapshot(collection(this.firestore, "channel"), (snapshot) => {
      this.channel = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as ChannelInterface));
      this.markChannelsReady();
    });
  }


  /**
   * Subscribes to the "user" collection and updates the local user array.
   * @returns A function to unsubscribe from the snapshot listener.
   */
  getUserCollection() {
    return onSnapshot(collection(this.firestore, "user"), (snapshot) => {
      this.user = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as UserInterface));
      this.userSubject.next(this.user);
    });
  }


  /**
   * Subscribes to the direct message conversations the given user is part of.
   * @param userId - the current user's id
   */
  subscribeToDms(userId: string): Promise<void> {
    this.unsubDms();
    const conversations = query(
      collection(this.firestore, "dm"),
      where('participants', 'array-contains', userId)
    );
    return new Promise<void>((resolve) => {
      this.unsubDms = onSnapshot(conversations, (snapshot) => {
        this.dms = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as DmInterface));
        resolve();
      });
    });
  }


  /**
   * Points the message listener at whatever conversation is currently open,
   * and reopens the thread if one was open before a reload.
   */
  openCurrentConversation() {
    const type = this.currentConversationType;
    const id = this.currentUser.currentChannel;
    if (!id || (type !== 'channel' && type !== 'dm')) {
      this.closeConversation();
      this.closeThread();
      return;
    }
    this.openConversation(type, id);
    if (this.currentUser.threadOpen && this.currentUser.postId) this.openThread(this.currentUser.postId);
    else this.closeThread();
  }


  /**
   * Swaps the posts listener over to another conversation. Called whenever the
   * open channel or direct message changes.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   */
  openConversation(type: ConversationType, id: string) {
    this.unsubPosts();
    this.posts = [];
    const messages = query(
      collection(this.firestore, `${this.conversationPath(type, id)}/posts`),
      orderBy('timestamp')
    );
    this.unsubPosts = onSnapshot(messages, (snapshot) => {
      this.posts = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as PostInterface));
    });
  }


  /** Stops listening to the current conversation's posts. */
  closeConversation() {
    this.unsubPosts();
    this.unsubPosts = () => { };
    this.posts = [];
  }


  /**
   * Swaps the thread listener over to another post.
   * @param postId - the post whose replies should be loaded
   */
  openThread(postId: string) {
    this.unsubThread();
    this.threadPosts = [];
    const path = this.currentConversationPath;
    if (!path) return;
    const replies = query(
      collection(this.firestore, `${path}/posts/${postId}/thread`),
      orderBy('timestamp')
    );
    this.unsubThread = onSnapshot(replies, (snapshot) => {
      this.threadPosts = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id } as PostInterface));
    });
  }


  /**
   * Opens the thread of the given post: remembers it on the current user and
   * starts listening to its replies.
   * @param postId - the post whose thread should be shown
   */
  showThread(postId: string) {
    this.currentUser.postId = postId;
    this.currentUser.threadOpen = true;
    this.openThread(postId);
  }


  /** Closes the open thread and stops listening to it. */
  hideThread() {
    this.currentUser.threadOpen = false;
    this.closeThread();
  }


  /**
   * Shows the given post's thread, or closes it when it is already the one on
   * screen.
   * @param postId - the post whose thread was clicked
   */
  toggleThread(postId: string) {
    const alreadyOpen = this.currentUser.threadOpen && this.currentUser.postId === postId;
    if (alreadyOpen) this.hideThread();
    else this.showThread(postId);
  }


  /** Stops listening to the open thread. */
  closeThread() {
    this.unsubThread();
    this.unsubThread = () => { };
    this.threadPosts = [];
  }


  // ------------------------------------------------------------- reading

  /** The post the currently open thread belongs to. */
  getThreadParentPost(): PostInterface | undefined {
    return this.posts.find(post => post.id === this.currentUser.postId);
  }


  /**
   * The search index, fetched on first use and reused afterwards. Concurrent
   * callers share one fetch.
   */
  loadSearchIndex(): Promise<SearchIndex> {
    if (!this.searchIndex) {
      // A rejected promise must not stay in the cache, or one failed fetch
      // would break search for the rest of the session.
      this.searchIndex = this.buildSearchIndex().catch((error) => {
        this.searchIndex = null;
        throw error;
      });
    }
    return this.searchIndex;
  }


  /**
   * Drops the cached index so the next search picks up what was just written.
   */
  invalidateSearchIndex() {
    this.searchIndex = null;
  }


  /**
   * Fetches the messages of every channel the current user is in, plus every
   * thread reply they can see.
   */
  private async buildSearchIndex(): Promise<SearchIndex> {
    const myChannels = this.channel.filter(entry => entry.user.includes(this.currentUser.id ?? ''));
    const [postsPerChannel, threads] = await Promise.all([
      Promise.all(myChannels.map(channel => this.fetchChannelPosts(channel))),
      this.fetchVisibleThreads(),
    ]);
    return { channelPosts: postsPerChannel.flat(), threads };
  }


  /**
   * All messages of one channel, paired with the channel for the result list.
   * @param channel - the channel to read
   */
  private async fetchChannelPosts(channel: ChannelInterface): Promise<ChannelPostSearchHit[]> {
    const snapshot = await getDocs(collection(this.firestore, `channel/${channel.id}/posts`));
    return snapshot.docs.map(entry => ({
      post: { ...entry.data(), id: entry.id } as PostInterface,
      channel,
    }));
  }


  /**
   * Every thread reply from the channels and conversations the current user
   * can see, with the conversation and parent post taken from the path.
   */
  private async fetchVisibleThreads(): Promise<ThreadSearchHit[]> {
    const replies = await getDocs(collectionGroup(this.firestore, 'thread'));
    const visible = new Set<string>([
      ...this.channel.filter(entry => entry.user.includes(this.currentUser.id ?? '')).map(entry => entry.id!),
      ...this.dms.map(entry => entry.id!),
    ]);

    return replies.docs.flatMap((entry) => {
      // channel|dm / {conversationId} / posts / {parentPostId} / thread / {replyId}
      const [conversationType, conversationId, , parentPostId] = entry.ref.path.split('/');
      if (!visible.has(conversationId)) return [];
      return [{
        thread: { ...entry.data(), id: entry.id } as PostInterface,
        parentType: conversationType as ConversationType,
        conversationId,
        parentPostId,
      }];
    });
  }


  /**
   * Filters the channel collection down to the ones the current user is a
   * member of.
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
   */
  checkCurrentUserIsMemberOfChannel(users: string[]) {
    return users.includes(this.currentUser.id || '');
  }


  /**
   * Removes users from channels that no longer exist in the user collection.
   */
  async removeUsersFromChannels(): Promise<void> {
    const currentUserIds = new Set(this.user.map(entry => entry.id));
    for (const channel of this.channel) {
      const filteredUserIds = channel.user.filter(id => currentUserIds.has(id));
      if (filteredUserIds.length === channel.user.length || !channel.id) continue;
      await updateDoc(doc(this.firestore, "channel", channel.id), { user: filteredUserIds });
    }
  }


  /**
   * Determines the conversation to open, from session storage, the user's
   * channels or their direct messages.
   * @param userData - The current user's data.
   */
  determineCurrentChannel(userData: CurrentUserInterface): string | undefined {
    const sessionChannel = sessionStorage.getItem("currentChannel");
    if (sessionChannel) return sessionChannel;
    if (!userData.id) return undefined;
    const channelId = this.channel.find(channel => channel.user.includes(userData.id!))?.id;
    if (channelId) {
      sessionStorage.setItem("currentChannel", channelId);
      return channelId;
    }
    const dmId = this.dms.find(dm => dm.participants.includes(userData.id!))?.id;
    if (dmId) sessionStorage.setItem("currentChannel", dmId);
    return dmId;
  }


  /**
   * Whether a user belongs to the seeded demo data. The security rules freeze
   * the name and avatar of those, so the UI should not offer to edit them.
   * @param userId - the user to check
   */
  isSeedUser(userId: string | undefined): boolean {
    return this.user.find(entry => entry.id === userId)?.isSeed === true;
  }


  /**
   * Whether a channel belongs to the seeded demo data. Its name, description
   * and owner are frozen by the security rules; only membership may change.
   * @param channelId - the channel to check
   */
  isSeedChannel(channelId: string | undefined): boolean {
    return this.channel.find(entry => entry.id === channelId)?.isSeed === true;
  }


  /**
   * Checks whether a user is online, based on the locally cached user list.
   * @param userId - the user to check
   */
  isUserOnline(userId: string): boolean {
    return this.user.find(entry => entry.id === userId)?.online ?? false;
  }


  // ------------------------------------------------------------- writing

  /**
   * Adds a new user after Firebase Auth registration, and creates the two
   * direct messages every new user starts with.
   * @param authUid - The authenticated user's UID.
   * @param userData - name, email and avatar of the new user.
   */
  async addUser(authUid: string, userData: { name: string, email: string, avatar: string }) {
    await setDoc(doc(this.firestore, "user", authUid), this.storageHelper.generateUser(userData));
    await this.storageHelper.createStarterDms(this, authUid, userData.name);
  }


  /**
   * Adds a new channel.
   * @param channelData - name, description and owner of the new channel.
   */
  async addChannel(channelData: { name: string, description: string, owner: string }) {
    try {
      const docRef = await addDoc(collection(this.firestore, "channel"), this.storageHelper.generateChannel(channelData));
      this.lastCreatedChannel = docRef.id;
      return docRef;
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Channels: ", error);
      throw error;
    }
  }


  /**
   * Updates an existing user's profile.
   * @param userId - The ID of the user to update.
   * @param userData - the fields to change.
   */
  async updateUser(userId: string, userData: Partial<UserInterface>) {
    await updateDoc(doc(this.firestore, "user", userId), userData);
  }


  /**
   * Updates an existing channel.
   * @param channelId - The ID of the channel to update.
   * @param channelData - the fields to change.
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
   * Makes sure the conversation between two users exists and returns its id.
   * Safe to call repeatedly - the id is derived from the participants, so a
   * second call just rewrites the same document.
   * @param userA - one participant
   * @param userB - the other participant
   */
  async ensureDm(userA: string, userB: string): Promise<string> {
    const id = this.buildDmId(userA, userB);
    if (this.dms.some(entry => entry.id === id)) return id;

    const reference = doc(this.firestore, "dm", id);
    // Only write when it is really missing: writing over a seeded conversation
    // would flip its isSeed flag, and the rules reject that.
    if ((await getDoc(reference)).exists()) return id;
    await setDoc(reference, { participants: [...new Set([userA, userB])], isSeed: false });
    return id;
  }


  /**
   * Appends a message to a conversation. The id generated on the client
   * becomes the document id, so the view can scroll to the message it just
   * sent without waiting for the write to come back.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   * @param newPost - the message to write
   */
  async addPost(type: ConversationType, id: string, newPost: PostInterface) {
    const { id: postId, ...fields } = newPost;
    await setDoc(doc(this.firestore, `${this.conversationPath(type, id)}/posts/${postId}`), {
      ...fields,
      threadCount: 0,
      lastThreadTimestamp: null,
      ...this.visitorFields(),
    });
    this.invalidateSearchIndex();
  }


  /**
   * Writes the welcome message a newly registered account finds in its inbox.
   *
   * This is the one message that must not expire, so it is written under a
   * fixed id and marked `isWelcome`. The security rules accept exactly that
   * combination without an `expiresAt`, and refuse to let it be edited
   * afterwards.
   * @param dmId - the conversation with the welcome persona
   * @param post - the message
   */
  async addWelcomePost(dmId: string, post: PostInterface) {
    const { id: _ignored, ...fields } = post;
    await setDoc(doc(this.firestore, `dm/${dmId}/posts/${WELCOME_POST_ID}`), {
      ...fields,
      threadCount: 0,
      lastThreadTimestamp: null,
      isSeed: false,
      isWelcome: true,
    });
    this.invalidateSearchIndex();
  }


  /**
   * Appends a reply to a post's thread and keeps the parent's reply counter
   * and last-reply timestamp in step.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   * @param postId - the post being replied to
   * @param newPost - the reply
   */
  async addThreadReply(type: ConversationType, id: string, postId: string, newPost: PostInterface) {
    const parentPath = `${this.conversationPath(type, id)}/posts/${postId}`;
    const { id: replyId, ...fields } = newPost;
    await setDoc(doc(this.firestore, `${parentPath}/thread/${replyId}`), { ...fields, ...this.visitorFields() });
    await updateDoc(doc(this.firestore, parentPath), {
      threadCount: increment(1),
      lastThreadTimestamp: newPost.timestamp,
    });
    this.invalidateSearchIndex();
  }


  /**
   * Changes the text of a message or of a thread reply.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   * @param postId - the message to change
   * @param text - the new text
   * @param parentPostId - set when the message is a thread reply
   */
  async updatePostText(type: ConversationType, id: string, postId: string, text: string, parentPostId?: string) {
    await updateDoc(doc(this.firestore, this.postPath(type, id, postId, parentPostId)), { text });
    this.invalidateSearchIndex();
  }


  /**
   * Replaces the reactions of a message or of a thread reply.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   * @param postId - the message to change
   * @param emoticons - the new reaction list
   * @param parentPostId - set when the message is a thread reply
   */
  async updatePostEmoticons(type: ConversationType, id: string, postId: string, emoticons: EmoticonsInterface[], parentPostId?: string) {
    await updateDoc(doc(this.firestore, this.postPath(type, id, postId, parentPostId)), { emoticons });
  }


  /**
   * Adds users to a channel.
   * @param channelId - the channel
   * @param newUserIds - the users to add
   */
  async addUsersToChannel(channelId: string, newUserIds: string[]): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, "channel", channelId), { user: arrayUnion(...newUserIds) });
    } catch (error) {
      console.error(`Fehler beim Hinzufügen von Benutzern zum Channel "${channelId}":`, error);
      throw error;
    }
  }


  /**
   * Checks whether another channel already carries the given name.
   * @param channelId - the channel to exclude from the check
   * @param newName - the name to look for
   */
  async channelNameExists(channelId: string, newName: string): Promise<boolean> {
    return this.channel
      .filter(channel => channel.id !== channelId)
      .some(channel => channel.name.toLowerCase() === newName.toLowerCase());
  }


  // ------------------------------------------------------------- internals

  /**
   * Document path of a message, one level deeper when it is a thread reply.
   * @param type - whether the conversation is a channel or a direct message
   * @param id - the channel or dm id
   * @param postId - the message
   * @param parentPostId - set when the message is a thread reply
   */
  private postPath(type: ConversationType, id: string, postId: string, parentPostId?: string): string {
    const base = `${this.conversationPath(type, id)}/posts`;
    return parentPostId ? `${base}/${parentPostId}/thread/${postId}` : `${base}/${postId}`;
  }


  /**
   * Fields that mark a document as visitor content: not part of the seed, and
   * carrying an expiry the Firestore TTL policy acts on.
   */
  private visitorFields() {
    return {
      isSeed: false,
      expiresAt: Timestamp.fromMillis(Date.now() + VISITOR_POST_LIFETIME_MS),
    };
  }
}
