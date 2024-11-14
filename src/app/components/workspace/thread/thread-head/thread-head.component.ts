import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-thread-head',
  standalone: true,
  imports: [],
  templateUrl: './thread-head.component.html',
  styleUrl: './thread-head.component.scss'
})
export class ThreadHeadComponent {
  storage = inject(FirebaseStorageService);

  constructor() { }

  channelName() {
    let currentChannel = this.storage.currentUser.currentChannelName;
    if (currentChannel?.startsWith('#')) return currentChannel.replace('#', '# ');
    else return '@ ' + currentChannel;
  }
}
