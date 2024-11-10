import { Component, Input } from '@angular/core';
import { ChannelHeadComponent } from '../channel-head/channel-head.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';
import { PostInterface } from '../../../../shared/interfaces/post.interface';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [ChannelHeadComponent, MessageComponent],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent extends ChannelHeadComponent {
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };

  constructor() {
    super();
  }

  getPosts() {
    let getPosts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    if (getPosts) return getPosts;
    else return [];
  }
}
