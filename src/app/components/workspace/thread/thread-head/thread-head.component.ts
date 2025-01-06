import { Component, inject } from '@angular/core';
import { ChannelHeadComponent } from '../../channel/channel-head/channel-head.component';

@Component({
  selector: 'app-thread-head',
  standalone: true,
  imports: [],
  templateUrl: './thread-head.component.html',
  styleUrl: './thread-head.component.scss'
})
export class ThreadHeadComponent extends ChannelHeadComponent {


  constructor() {
    super();
  }

  channelNameThread() {
    let currentChannel = this.storage.currentUser.currentChannelName;
    
    if (currentChannel?.startsWith('#')) {
        // Entfernt die ersten zwei Zeichen ('# ')
        return currentChannel.slice(1);
    } else {
        // Fügt '@ ' vor dem aktuellen Channel-Namen hinzu
        return '@ ' + currentChannel;
    }
}
}
