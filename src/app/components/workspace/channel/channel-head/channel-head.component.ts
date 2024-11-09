import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})
export class ChannelHeadComponent {
  storage = inject(FirebaseStorageService);


  constructor() { }


  findChannel() {
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);

    if (foundChannel) return 'channel';
    else if (foundDM) return 'dm';
    else return '';
  }


  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }

  channelUser() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
  }

  findAvatar(user: string) {
    return this.storage.user.find(u => u.id === user)?.avatar;
  }



   userAvatar() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    return this.storage.user.find(user => user.id === foundUser)?.avatar;
  }

  userName() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    return this.storage.user.find(user => user.id === foundUser)?.name;
  }


}



