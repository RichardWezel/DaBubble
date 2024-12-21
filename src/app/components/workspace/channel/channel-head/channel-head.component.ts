import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle, CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewMessageInputHeadComponent } from "./new-message-input-head/new-message-input-head.component"; // Importiere FormsModule
import { ChannelMemberDialogComponent } from './channel-member-dialog/channel-member-dialog.component';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';
import { ChannelEditComponent } from '../../../../shared/components/dialog/channel-edit/channel-edit.component';
import { AddChannelMemberDialogComponent } from './add-channel-member-dialog/add-channel-member-dialog.component';

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [
    NgStyle,
    FormsModule,
    NewMessageInputHeadComponent,
    ChannelMemberDialogComponent,
    ChannelEditComponent,
    CommonModule,
    NgFor,
    NgIf,
    AddChannelMemberDialogComponent
  ],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})

export class ChannelHeadComponent implements OnInit {
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  channelUsers: string[] = [];
  isChannelEditVisible: boolean = false; // Steuerung für ChannelEdit

  ngOnInit() {
    this.updateChannelUsers();
  }

  updateChannelUsers() {
    const users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    this.channelUsers = users ? users : [];
  }

  openChannelEdit() {
    console.log('ChannelEdit geöffnet');
    this.isChannelEditVisible = true;
  }

  // Schließt ChannelEditComponent
  closeChannelEdit() {
    this.isChannelEditVisible = false;
  }

  channelCreator(): string {
    const currentChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    if (!currentChannel) {
      return 'Unbekannt'; // Fallback, falls der Channel nicht gefunden wird
    }
    const owner = this.storage.user.find(user => user.id === currentChannel.owner);
    return owner?.name || '';
  }

  channelDescription(): string {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.description || '';
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
   * Matches the string property currentChannel of the currentUser to determine whether a channel or a user ID is present and returns ‘channel’ or ‘dm’ accordingly. 
   * If the value ‘newMessage’ is assigned in the sessionStorage under the key ‘currentChannel’, ‘newMessage’ is returned. 
   * Otherwise ‘ ’ is returned.
   *
   * @returns {string} "channel" | "dm" | "newMessage" | ""
   */
  findChannel(): "channel" | "dm" | "newMessage" | "" {
    // findet den ersten Channel, deren id mit der currentChannel des currentUser übereinstimmt.
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);
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

  channelName(): string {
    return (
      this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name || ''
    );
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
    let foundUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    let avatar: string = this.storage.user.find(user => user.id === foundUser)!.avatar;
    if (avatar) return avatar;
    else return '';
  }


  userName() {
    let foundUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    if (foundUser === this.storage.currentUser.id) return this.storage.currentUser.name + ' (Du)';
    else return this.storage.user.find(user => user.id === foundUser)?.name;
  }

  @ViewChild('addChannelMemberDialog') addChannelMemberDialog!: AddChannelMemberDialogComponent;

  openAddChannelMemberDialog(event: Event) {
    event.stopPropagation();
    if (this.addChannelMemberDialog) {
      this.addChannelMemberDialog.openDialog();
    } else {
      console.log("Error of call channelMemberDialog.openDialog()")
    }
  }
  }