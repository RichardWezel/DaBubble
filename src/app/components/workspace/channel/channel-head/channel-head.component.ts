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
    let foundDM = this.storage.user.find(dm => dm.id === this.storage.currentUser.currentChannel);
    if (foundChannel) return 'channel';
    else if (foundDM) return 'dm';
    else return '';
  }
}



