import { Component } from '@angular/core';
import { ChannelMessagesComponent } from '../../channel/channel-messages/channel-messages.component';
import { DateSeparatorComponent } from '../../../../shared/components/date-separator/date-separator.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [DateSeparatorComponent, MessageComponent, ChannelMessagesComponent],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent extends ChannelMessagesComponent {


  constructor() {
    super();
  }


  /**
   * Retrieves the original post within a channel that started the thread.
   * @returns {PostInterface} The original post that initiated the thread or a default empty post if not found.
   */
  getOriginalPostFromChannel() {
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post : { text: '', author: '', timestamp: 0, thread: false, id: '' };
  }


  /**
   * Retrieves all the thread messages associated with a specific original post in a channel.
   * @returns {PostInterface[]} Array of thread messages or an empty array if none exist.
   */
  getThreadOfPost() {
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post.threadMsg : [];
  }


  /**
   * Retrieves the original post within a direct message (DM) session that started the thread.
   * @returns {PostInterface} The original post from a DM that initiated the thread or a default empty post if not found.
   */
  getOriginalPostFromDm() {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let posts = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post : { text: '', author: '', timestamp: 0, thread: false, id: '' };
  }


  /**
   * Retrieves all the thread messages associated with a specific original post in a direct message (DM) session.
   * @returns {PostInterface[]} Array of thread messages or an empty array if none exist.
   */
  getThreadOfDm() {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let posts = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post.threadMsg : [];
  }
}
