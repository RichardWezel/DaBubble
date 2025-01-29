import { ElementRef, inject, Injectable } from '@angular/core';
import { PostInterface } from '../../../interfaces/post.interface';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { UidService } from '../../../services/uid.service';
import { UserInterface } from '../../../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class SendMessageService {
  storage = inject(FirebaseStorageService);


  constructor() { }


  /**
   * Checks if the current channel is a channel in the storage.
   * Searches the list of channels to find one matching the current channel ID.
   * 
   * @returns {object | undefined} The channel object if found, otherwise undefined.
   */
  isChannel(): object | undefined {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
  }


  /**
   * Checks if the current channel is a direct message (DM).
   * Searches the current user's DM list to find a DM matching the current channel ID.
   * 
   * @returns {object | undefined} The DM object if found, otherwise undefined.
   */
  isDM(): object | undefined {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    return curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
  }


  /**
   * Checks if the current direct message is a self-direct message.
   * A self-direct message is a direct message where the contact is the same as the current user.
   * @returns {boolean}
   */
  isSelfDm(): boolean {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    return this.storage.currentUser.id === curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact;
  }


  /**
   * If the user is in a channel, calls writeThreadToChannel with the new post.
   * If the user is in a DM, calls writeThreadToDm with the new post.
   * @param newPost - The new post to append to the currently replied-to post.
   */
  handleThreadPost(newPost: PostInterface) {
    if (this.isChannel()) this.writeThreadToChannel(newPost);
    else if (this.isDM()) this.writeThreadToDm(newPost);
  }


  /**
   * If the user is in a channel, finds the post that the user is currently replying to by ID,
   * and updates it with the new post text.
   * @param newPost - The new post to append to the currently replied-to post.
   */
  writeThreadToChannel(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    if (post && this.storage.currentUser.postId) {
      let updatedPost = this.updatePost(post, newPost);
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel, this.storage.currentUser.postId, updatedPost);
    }
  }


  /**
   * Writes a new thread message to a direct message (DM).
   * This function updates the existing post with a new message in the thread.
   * If the DM is not a self-DM, it updates the DM for both users involved.
   * 
   * @param newPost - The new post to add to the thread.
   */
  writeThreadToDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let dm = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
    let post = dm?.posts.find(post => post.id === this.storage.currentUser.postId);
    if (post && this.storage.currentUser.postId) {
      let updatedPost = this.updatePost(post, newPost);
      this.storage.updateDmPost(this.storage.currentUser.id, dm?.contact || '', this.storage.currentUser.postId, updatedPost);
      if (!this.isSelfDm())
        this.storage.updateDmPost(dm?.contact || '', this.storage.currentUser.id, this.storage.currentUser.postId, updatedPost);
    }
  }


  /**
   * Updates an existing post with a new post and sets the post as a thread.
   * The new post is added to the threadMsg array of the existing post.
   * @param post - The existing post to update.
   * @param newPost - The new post to add to the thread.
   * @returns The updated post with the new post added to its thread.
   */
  updatePost(post: PostInterface, newPost: PostInterface) {
    post.thread = true;
    post.threadMsg?.push(newPost);
    return post;
  }


  /**
   * Writes a new post to a channel or a DM and updates the Firestore "channel" or "user" collection.
   * If the post is a DM and the recipient is not the user itself, it writes the post to the recipient's DM as well.
   * @param newPost - The new post to add.
   */
  handleNormalPost(newPost: PostInterface) {
    if (this.isChannel()) this.writeNormalPostToChannel(newPost);
    else if (this.isDM()) {
      this.writeNormalPostToDm(newPost);
      if (!this.isSelfDm()) this.writeNormalPostToContactDm(newPost);
    }
  }


  /**
   * Writes a normal post to the current channel.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the channel associated with the current user's active channel.
   *
   * @param newPost - The new post to write to the channel.
   */
  writeNormalPostToChannel(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writePosts(this.storage.currentUser.currentChannel, newPost);
  }


  /**
   * Writes a normal post to the direct message (DM) of the current user.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the DM with the contact associated with the current DM.
   *
   * @param newPost - The new post to write to the DM.
   */
  writeNormalPostToDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writeDm(this.storage.currentUser.id, this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', newPost);
  }


  /**
   * Writes a normal post to the direct message (DM) of the contact associated with the current DM.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the contact's DM with the current user's ID as the contact.
   *
   * @param newPost - The new post to write to the contact's DM.
   */
  writeNormalPostToContactDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writeDm(this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', this.storage.currentUser.id, newPost);
  }


  /**
   * Edits a message in a channel or direct message (DM), depending on the value of the `thread` parameter.
   * If the `thread` parameter is true, it edits a thread message; otherwise, it edits the main message.
   * The function first determines the origin of the message (channel or DM) by checking if the current channel
   * matches a DM in the current user's DM list. If the origin is a channel, it updates the thread message in the
   * channel post. Otherwise, it updates the thread message in the DM post.
   * @param post - The post object containing the updated text and the ID of the thread message to be updated.
   * @param thread - A boolean indicating whether to update the thread message (true) or the main message (false).
   */
  editMessage(post: PostInterface, thread: boolean): void {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    const curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    const origin = this.getMessageOrigin(curUser);
    const isChannel = origin === 'channel';
    if (thread) this.updateThreadMessage(post, isChannel, curUser);
    else this.updateMainMessage(post, isChannel, curUser);
  }


  /**
   * Determines the origin of the message by checking if the current channel is a direct message (DM).
   * If the current channel matches a DM in the current user's DM list, it returns 'dm'. Otherwise, it returns 'channel'.
   * 
   * @param curUser - The current user object, which may be undefined.
   * @returns 'dm' if the current channel is a direct message; 'channel' otherwise.
   */
  private getMessageOrigin(curUser: UserInterface | undefined): 'dm' | 'channel' {
    return curUser?.dm.some(dm => dm.id === this.storage.currentUser.currentChannel) ? 'dm' : 'channel';
  }


  /**
   * Updates the text of a specific thread message within a channel or direct message (DM).
   * 
   * If the `isChannel` flag is true, it updates the thread message in the current channel post. 
   * Otherwise, it updates the thread message in the current DM post.
   * 
   * @param post - The post object containing the updated text and the ID of the thread message to be updated.
   * @param isChannel - A boolean indicating whether the update should be performed on a channel (true) or a DM (false).
   * @param curUser - The current user object, which may be undefined, used to locate the DM post if `isChannel` is false.
   */
  private updateThreadMessage(post: PostInterface, isChannel: boolean, curUser: UserInterface | undefined): void {
    if (isChannel) {
      const currentPost = this.getChannelPost();
      const threadMsg = currentPost?.threadMsg?.find(thread => thread.id === post.id);
      if (threadMsg) threadMsg.text = post.text;
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel!, this.storage.currentUser.postId!, currentPost!);
    } else {
      const { currentDm, dmPost } = this.getDmPost(curUser);
      const dmThreadMsg = dmPost?.threadMsg?.find(thread => thread.id === post.id);
      if (dmThreadMsg) dmThreadMsg.text = post.text;
      this.storage.updateDmPost(this.storage.currentUser.id!, currentDm?.contact!, this.storage.currentUser.postId!, dmPost!);
    }
  }


  /**
   * Updates the main post (i.e., not a thread message) associated with the current channel or direct message (DM) session.
   * If the current user or channel information is not available, the function returns immediately.
   *
   * @param post - The updated post object with the new text.
   * @param isChannel - A boolean indicating whether the post is from a channel (true) or DM (false).
   * @param curUser - The current user object from the storage.
   */
  private updateMainMessage(post: PostInterface, isChannel: boolean, curUser: UserInterface | undefined): void {
    if (isChannel) {
      const currentPost = this.getChannelPost(post.id);
      if (currentPost) currentPost.text = post.text;
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel!, post.id, currentPost!);
    } else {
      const { currentDm, dmPost } = this.getDmPost(curUser, post.id);
      if (dmPost) dmPost.text = post.text;
      this.storage.updateDmPost(this.storage.currentUser.id!, currentDm?.contact!, post.id, dmPost!);
    }
  }


  /**
   * Retrieves a specific post from the current channel based on the provided post ID.
   * If no post ID is provided, it defaults to using the current post ID from the storage.
   * 
   * @param postId - The optional ID of the post to retrieve.
   * @returns The post object if found, otherwise undefined.
   */
  private getChannelPost(postId?: string): PostInterface | undefined {
    const posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    return posts?.find(p => p.id === (postId || this.storage.currentUser.postId));
  }


  /**
   * Retrieves the direct message (DM) post object with the given post ID, or the current post ID if not provided.
   * @param curUser - The UserInterface object of the current user.
   * @param postId - The optional ID of the post to retrieve.
   * @returns An object with the DM and the DM post, or { currentDm: undefined, dmPost: undefined } if not found.
   */
  private getDmPost(curUser: UserInterface | undefined, postId?: string) {
    const currentDm = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
    const dmPost = currentDm?.posts?.find(p => p.id === (postId || this.storage.currentUser.postId));
    return { currentDm, dmPost };
  }
}
