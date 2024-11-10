import { Component, inject } from '@angular/core';

import { ChannelHeadComponent } from '../channel-head/channel-head.component';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [ChannelHeadComponent],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss'
})
export class ChannelMessagesComponent extends ChannelHeadComponent {

  constructor() {
    super();
  }

  getPosts() {
    let getPosts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    if (getPosts) return getPosts;
    else return [];
  }
}
