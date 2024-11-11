import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})
export class ChannelHeadComponent {
  storage = inject(FirebaseStorageService);
  imgTag: string = 'assets/icons/tag.svg';
  imgCaret: string = 'assets/icons/user-caret.svg';


  constructor() { }

  /**
   * Bestimmt den Typ des aktuell ausgewählten Kanals (öffentlicher Kanal oder Direktnachricht) 
   * und setzt den Namen des Kanals entsprechend.
   *
   * Diese Methode durchsucht die verfügbaren Kanäle und Direktnachrichten des aktuellen Benutzers, 
   * um festzustellen, ob die `currentChannel` ID einem öffentlichen Kanal oder einer Direktnachricht entspricht.
   * Abhängig vom gefundenen Typ wird der `currentChannelName` gesetzt und der Typ als Rückgabewert zurückgegeben.
   *
   * @returns {string} 
   * - Gibt `'channel'` zurück, wenn ein öffentlicher Kanal gefunden wurde.
   * - Gibt `'dm'` zurück, wenn eine Direktnachricht gefunden wurde.
   * - Gibt einen leeren String `''` zurück, wenn weder ein Kanal noch eine Direktnachricht gefunden wurde.
   */
  findChannel(): "channel" | "dm" | "" {
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);

    if (foundChannel) {
      this.storage.currentUser.currentChannelName = '#' + foundChannel.name;
      return 'channel';
    } else if (foundDM) {
      this.storage.currentUser.currentChannelName = this.storage.user.find(user => user.id === foundDM?.contact)?.name;
      return 'dm';
    }
    else return '';
  }


  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }


  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
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



