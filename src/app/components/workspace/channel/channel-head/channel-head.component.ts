import { Component, inject, ViewChild, ElementRef, NgModule } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { NewMessageInputHeadComponent } from "./new-message-input-head/new-message-input-head.component"; // Importiere FormsModule

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [NgStyle,
    FormsModule, NewMessageInputHeadComponent],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})
export class ChannelHeadComponent {
  storage = inject(FirebaseStorageService);


  /**
   * Gleicht ab, ob ein Channel oder eine DM als ID in currentChannel des currentUsers enthalten ist 
   * und gibt je nach Ergebnis 'channel' || 'dm' || '' zurück.
   *
   * @returns {string} 
   */
  findChannel(): "channel" | "dm" | "newMessage" | "" {
    // findet den ersten Channel, deren id mit der currentChannel des currentUser übereinstimmt.
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);
    // console.log('foundDM: ', foundDM)
    if (foundChannel) {
      this.storage.currentUser.currentChannelName = '#' + foundChannel.name;
      return 'channel';
    } else if (foundDM) {
      this.storage.currentUser.currentChannelName = this.storage.user.find(user => user.id === foundDM?.contact)?.name;
      return 'dm';
    } else if (sessionStorage.getItem('currentChannel') == "newMessage") {
      return 'newMessage';
    }
    else
      return '';
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
    let avatar = this.storage.user.find(u => u.id === user)?.avatar;
    if (avatar) return avatar;
    else return '';
  }


  userAvatar() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    let avatar: string = this.storage.user.find(user => user.id === foundUser)!.avatar;
    if (avatar) return avatar;
    else return '';
  }


  userName() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    return this.storage.user.find(user => user.id === foundUser)?.name;
  }


}