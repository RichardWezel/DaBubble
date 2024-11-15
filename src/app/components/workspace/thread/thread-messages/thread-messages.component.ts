import { Component } from '@angular/core';
import { ChannelMessagesComponent } from '../../channel/channel-messages/channel-messages.component';
import { DateSeparatorComponent } from '../../../../shared/components/date-separator/date-separator.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [DateSeparatorComponent, MessageComponent],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent extends ChannelMessagesComponent {


  constructor() {
    super();
  }

  getOriginalPostFromChannel() {
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post : { text: '', author: '', timestamp: 0, thread: false, id: '' };
  }

  getThreadOfPost() {
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post.threadMsg : [];
  }

  getOriginalPostFromDm() {
    let posts = this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post : { text: '', author: '', timestamp: 0, thread: false, id: '' };
  }

  getThreadOfDm() {
    let posts = this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    return post ? post.threadMsg : [];
  }
}
