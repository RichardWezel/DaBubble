import { Component, inject } from '@angular/core';
import { ChannelHeadComponent } from '../../channel/channel-head/channel-head.component';
import { SetMobileViewService } from '../../../../shared/services/set-mobile-view.service';

@Component({
  selector: 'app-thread-head',
  standalone: true,
  imports: [],
  templateUrl: './thread-head.component.html',
  styleUrl: './thread-head.component.scss'
})
export class ThreadHeadComponent extends ChannelHeadComponent {

  public isLargeScreen: boolean = window.innerWidth >= 1300;

  constructor(private viewService: SetMobileViewService) {
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

  closeThread() {
    if (this.isLargeScreen) {
      this.storage.currentUser.threadOpen = false
    } else {
      this.viewService.setCurrentView('channel');
    }
  }
  
}
