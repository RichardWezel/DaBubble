import { Component, inject, Injectable, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { InputfieldComponent } from '../inputfield/inputfield.component';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { EmoticonsInterface } from '../../interfaces/emoticons.interface';
import { PostInterface } from '../../interfaces/post.interface';
import { UserInterface } from '../../interfaces/user.interface';


@Component({
  selector: 'app-emoji-selector',
  standalone: true,
  imports: [FormsModule, PickerModule],
  templateUrl: './emoji-selector.component.html',
  styleUrl: './emoji-selector.component.scss'
})
@Injectable({
  providedIn: 'root'
})
export class EmojiSelectorComponent {
  storage = inject(FirebaseStorageService);
  message: string = '';
  @Input() inputField?: InputfieldComponent;
  @Input() isInput: boolean = false;
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() origin: string = '';
  @Input() isThread: boolean = false;


  constructor() { }


  /**
   * Adds the given emoji to the current message of the inputfield.
   * @param event - The event containing the emoji to add to the message.
   */
  addEmojiToMessage(event: any) {
    this.inputField?.addEmoji(event.emoji.native);
  }


  /**
   * Adds the given emoji to the current reaction of the post.
   * @param event - The event containing the emoji to add to the reaction.
   */
  addEmojiToReaction(event: any) {
    if (this.origin === '' || this.post.id === '') {
      this.origin = event.emoji.origin;
      this.post = event.emoji.post;
      this.isThread = event.emoji.isThread;
    };
    let react: EmoticonsInterface = this.generateReaction(event);
    this.searchCurrentReaction(event, react);
    this.postReaction(event);
  }


  /**
   * Generates a reaction object to add to the post's reaction list.
   * It uses the given event to get the emoji type and the current user's ID.
   * @param event - The event containing the emoji to add to the reaction.
   * @returns A reaction object with the emoji type, the current user's ID, and a count of 1.
   */
  generateReaction(event: any) {
    return {
      type: event.emoji.native,
      name: [this.storage.currentUser?.id ?? ''],
      count: 1
    }
  }


  /**
   * Searches and updates the current reaction to a post based on the provided emoji event.
   * This function checks if the user has already reacted with the given emoji.
   * If the user already reacted, it handles the existing user reaction by decrementing the count.
   * If the emoji type exists but the user hasn't reacted, it increments the count.
   * If the emoji type doesn't exist, it adds the new reaction to the post's emoticons.
   * 
   * @param event - The event containing the emoji to be added as a reaction.
   * @param react - The reaction object created based on the emoji and current user details.
   */
  searchCurrentReaction(event: any, react: EmoticonsInterface) {
    if (!this.storage.currentUser.id) return;
    if (this.post.emoticons) {
      let emote = this.post.emoticons.find(emote => emote.type === event.emoji.native);
      if (emote?.name.includes(this.storage.currentUser?.id)) this.handleExistingUserReaction(emote);
      else if (emote) this.handleExistingReaction(emote);
      else this.post.emoticons.push(react);
    } else this.post.emoticons = [react];
  }


  /**
   * Handles the existing user reaction by decrementing the count and removing the user from the name list.
   * If the count is 0 after decrementing, it removes the reaction from the post's emoticons.
   * @param emote - The existing reaction object to be updated.
   */
  handleExistingUserReaction(emote: EmoticonsInterface) {
    emote.count -= 1;
    emote.name.splice(emote.name.indexOf(this.storage.currentUser?.id!), 1);
    if (emote.count === 0) this.post.emoticons!.splice(this.post.emoticons!.indexOf(emote), 1);
  }


  /**
   * Handles the existing reaction by incrementing the count and adding the user to the name list.
   * @param emote - The existing reaction object to be updated.
   */
  handleExistingReaction(emote: EmoticonsInterface) {
    emote.count += 1;
    emote.name.push(this.storage.currentUser?.id!);
  }


  /**
   * Handles the posting of a reaction to a post or a DM.
   * If the user is in a channel, it checks if the post is a thread and calls updateThreadReaction
   * or updateMainReaction accordingly.
   * If the user is in a DM, it calls updateThreadReaction or updateMainReaction depending on whether the post is a thread.
   * @param event - The event that triggered the posting of the reaction.
   */
  postReaction(event: any): void {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    const curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    const { currentPost, dmPost, currentDm } = this.getPostData(curUser);
    if (this.isThread) this.updateThreadReaction(currentPost, dmPost, currentDm);
    else this.updateMainReaction(currentPost, dmPost, currentDm);
    this.resetReactionState(event);
  }


  /**
   * Retrieves the current post and DM post based on the current channel and post ID
   * from the storage. It returns an object containing the current post, DM post, and DM.
   * @param curUser - The current user object from the storage.
   * @returns An object containing the current post, DM post, and DM.
   */
  private getPostData(curUser: UserInterface | undefined) {
    const posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    const currentPost = posts?.find(post => post.id === this.storage.currentUser.postId);
    const currentDm = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
    const dmPost = currentDm?.posts?.find(post => post.id === this.storage.currentUser.postId);
    return { currentPost, dmPost, currentDm };
  }


  /**
   * Updates the reaction of a thread message in a channel or DM.
   * It uses the origin, post ID, and isThread properties to determine whether to update a channel or DM post.
   * If the post is a thread message, it updates the thread message in the channel or DM post.
   * It then updates the channel or DM post in the storage.
   * @param currentPost - The current post object from the channel.
   * @param dmPost - The current DM post object from the DM.
   * @param currentDm - The current DM object from the storage.
   */
  private updateThreadReaction(currentPost?: PostInterface, dmPost?: PostInterface, currentDm?: any): void {
    if (this.origin === 'channel') {
      const threadMsg = currentPost?.threadMsg?.find(thread => thread.id === this.post.id);
      if (threadMsg) threadMsg.emoticons = this.post.emoticons;
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel!, this.storage.currentUser.postId!, currentPost!);
    } else {
      const dmThreadMsg = dmPost?.threadMsg?.find(thread => thread.id === this.post.id);
      if (dmThreadMsg) dmThreadMsg.emoticons = this.post.emoticons;
      this.storage.updateDmPost(this.storage.currentUser.id!, currentDm?.contact!, this.storage.currentUser.postId!, dmPost!);
    }
  }


  /**
   * Updates the emoticons of the main post (i.e., not a thread message) associated with the current channel or direct message (DM).
   * It uses the origin to determine whether to update a channel or DM post.
   * Updates the channel or DM post in the storage with the new emoticons.
   * 
   * @param currentPost - The current post object from the channel.
   * @param dmPost - The current DM post object from the DM.
   * @param currentDm - The current DM object from the storage.
   */
  private updateMainReaction(currentPost?: PostInterface, dmPost?: PostInterface, currentDm?: any): void {
    if (this.origin === 'channel') {
      if (currentPost) currentPost.emoticons = this.post.emoticons;
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel!, this.post.id, currentPost!);
    } else {
      if (dmPost) dmPost.emoticons = this.post.emoticons;
      this.storage.updateDmPost(this.storage.currentUser.id!, currentDm?.contact!, this.post.id, dmPost!);
    }
  }


  /**
   * Resets the component state after a reaction has been added to a post.
   * It resets the post object, origin and isThread properties to their initial values.
   * This is necessary because the component is not destroyed when a reaction is added, so
   * the state needs to be reset to prepare for the next reaction.
   * The function is called when the emoji selector emits a click event.
   * @param event - The event object emitted by the emoji selector.
   */
  private resetReactionState(event: any): void {
    if (event.emoji.post || event.emoji.isThread) {
      this.post = { text: '', author: '', timestamp: 0, thread: false, id: '' };
      this.origin = '';
      this.isThread = false;
    }
  }
}
