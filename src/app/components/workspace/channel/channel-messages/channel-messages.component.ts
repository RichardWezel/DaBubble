import { Component, Input } from '@angular/core';
import { ChannelHeadComponent } from '../channel-head/channel-head.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';
import { PostInterface } from '../../../../shared/interfaces/post.interface';
import { DateSeparatorComponent } from '../../../../shared/components/date-separator/date-separator.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [MessageComponent, DateSeparatorComponent, CommonModule],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent extends ChannelHeadComponent {
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  compareTimestamp: number = 0;
  originalPost: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };


  constructor() {
    super();
  }


  /**
   * Retrieves the posts associated with the current channel from the storage.
   * @returns {PostInterface[]} An array of posts from the current channel or an empty array if none are found.
   */
  getPostOfChannel() {
    let getPosts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    if (getPosts) return getPosts;
    else return [];
  }


  /**
   * Retrieves the posts associated with the current direct message session from the storage.
   * @returns {PostInterface[]} An array of posts from the current direct message session or an empty array if none are found.
   */
  getPostOfDm() {
    let getPosts = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    return getPosts ? getPosts : [];
  }


  /**
   * Formats the timestamp of a post into a readable date string and updates the compareTimestamp for determining when to show date separators.
   * @param {PostInterface} post - The post object containing the timestamp.
   * @returns {string} A formatted date string in the 'de-DE' locale.
   */
  trackByDate(post: PostInterface) {
    const date = new Date(post.timestamp);
    this.compareTimestamp = new Date(post.timestamp).setHours(0, 0, 0, 0);
    const formattedDate = date.getDate() === new Date().getDate() ? 'Heute' : date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formattedDate;
  }


  /**
   * Converts a timestamp to the start of the corresponding day to help differentiate messages by date.
   * @param {number} timestamp - The timestamp of a post.
   * @returns {number} The timestamp at the beginning of the day (00:00:00.000).
   */
  currentDate(timestamp: number) {
    const date = new Date(timestamp);
    return new Date(date).setHours(0, 0, 0, 0);
  }


  /**
   * Resets the comparison timestamp used for date separation in the message list.
   */
  resetCompareTimestamp() {
    this.compareTimestamp = 0;
  }


  /**
   * Provides a unique identifier for each post to optimize performance during list rendering.
   * @param {number} index - The index of the post in the list.
   * @param {PostInterface} post - The post object.
   * @returns {string} The post ID used for tracking list changes.
   */
  trackByPostId(index: number, post: PostInterface): string {
    return post.id;
  }

}
