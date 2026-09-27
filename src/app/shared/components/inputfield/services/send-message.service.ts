import { inject, Injectable } from '@angular/core';
import { PostInterface } from '../../../interfaces/post.interface';
import { ConversationType, FirebaseStorageService } from '../../../services/firebase-storage.service';

/**
 * Writes messages into the conversation that is currently open.
 *
 * Channels and direct messages share one document layout, so everything here
 * only needs to know which of the two it is writing to - the three separate
 * write paths this service used to have (channel, own DM copy, contact's DM
 * copy) collapsed into one.
 */
@Injectable({
  providedIn: 'root'
})
export class SendMessageService {
  storage = inject(FirebaseStorageService);


  constructor() { }


  /** Whether a channel is currently open. */
  isChannel(): boolean {
    return this.storage.currentConversationType === 'channel';
  }


  /** Whether a direct message is currently open. */
  isDM(): boolean {
    return this.storage.currentConversationType === 'dm';
  }


  /** Whether the open direct message is the one the user has with themselves. */
  isSelfDm(): boolean {
    return this.isDM() && this.storage.dmContact(this.storage.currentUser.currentChannel) === this.storage.currentUser.id;
  }


  /**
   * Writes a reply into the thread of the post the user is currently
   * replying to.
   * @param newPost - the reply
   */
  handleThreadPost(newPost: PostInterface) {
    const target = this.currentTarget();
    const parentPostId = this.storage.currentUser.postId;
    if (!target || !parentPostId) return;
    this.storage.addThreadReply(target.type, target.id, parentPostId, newPost);
  }


  /**
   * Writes a message into the open conversation.
   * @param newPost - the message
   */
  handleNormalPost(newPost: PostInterface) {
    const target = this.currentTarget();
    if (!target) return;
    this.storage.addPost(target.type, target.id, newPost);
  }


  /**
   * Saves an edited message.
   * @param post - the message carrying the new text
   * @param thread - true when the edited message is a thread reply
   */
  editMessage(post: PostInterface, thread: boolean): void {
    const target = this.currentTarget();
    if (!target) return;
    const parentPostId = thread ? this.storage.currentUser.postId : undefined;
    this.storage.updatePostText(target.type, target.id, post.id, post.text, parentPostId);
  }


  /**
   * The conversation currently being written to, or null when neither a
   * channel nor a direct message is open.
   */
  private currentTarget(): { type: ConversationType, id: string } | null {
    const type = this.storage.currentConversationType;
    const id = this.storage.currentUser.currentChannel;
    if (!id || (type !== 'channel' && type !== 'dm')) return null;
    return { type, id };
  }
}
