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


  /**
   * Returns the display name of the current channel or direct message. This method adjusts the formatting based on whether the
   * channel is identified by a hashtag (indicating a public channel) or is a direct message (DM).
   * 
   * @returns {string} The formatted name of the current channel or direct message.
   * For channels, it removes the prefix hash ('#'), and for DMs, it prefixes the name with '@'.
   */
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
