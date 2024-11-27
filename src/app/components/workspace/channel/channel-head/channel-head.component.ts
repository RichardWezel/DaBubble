import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle, CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewMessageInputHeadComponent } from "./new-message-input-head/new-message-input-head.component"; // Importiere FormsModule
import { ChannelMemberDialogComponent } from './channel-member-dialog/channel-member-dialog.component';
import { UserInterface } from '../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [
    NgStyle,
    FormsModule, 
    NewMessageInputHeadComponent, 
    ChannelMemberDialogComponent,
  CommonModule,
NgFor,
NgIf],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})

export class ChannelHeadComponent implements OnInit{
  storage = inject(FirebaseStorageService);
  channelUsers: string [] = [];

  ngOnInit() {
    this.updateChannelUsers();
  }

  updateChannelUsers() {
    const users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    this.channelUsers = users ? users : [];
  }

  @ViewChild('channelMemberDialog') channelMemberDialog!: ChannelMemberDialogComponent;

  callOpenDialog(event: Event) {
    event.stopPropagation();
    if (this.channelMemberDialog) {
      this.channelMemberDialog.openDialog();
    } else {
      console.log("Error of call channelMemberDialog.openDialog()")
    }
  }

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
    if (foundUser === this.storage.currentUser.id) return this.storage.currentUser.name + ' (Du)';
    else return this.storage.user.find(user => user.id === foundUser)?.name;
  }


}