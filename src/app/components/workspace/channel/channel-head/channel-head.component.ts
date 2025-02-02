import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle, CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewMessageInputHeadComponent } from "./new-message-input-head/new-message-input-head.component"; // Importiere FormsModule
import { ChannelMemberDialogComponent } from '../../../../shared/components/dialog/channel-member-dialog/channel-member-dialog.component';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';
import { ChannelEditComponent } from '../../../../shared/components/dialog/channel-edit/channel-edit.component';
import { AddChannelMemberDialogComponent } from '../../../../shared/components/dialog/add-channel-member-dialog/add-channel-member-dialog.component';

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
  isChannelEditVisible: boolean = false; // Controls visibility of ChannelEdit

  @ViewChild('channelMemberDialog') channelMemberDialog!: ChannelMemberDialogComponent;
  @ViewChild('addChannelMemberDialog') addChannelMemberDialog!: AddChannelMemberDialogComponent;

  /**
   * Initialize component state by updating the list of channel users.
   */
  ngOnInit() {
    this.updateChannelUsers();
  }


  /**
   * Fetches the current channel's users from the storage and updates the local state.
   */
  updateChannelUsers() {
    const users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    this.channelUsers = users ? users : [];
  }


  /**
   * Opens the channel edit dialog.
   */
  openChannelEdit() {
    this.isChannelEditVisible = true;
  }


  /**
   * Closes the channel edit dialog.
   */
  closeChannelEdit() {
    this.isChannelEditVisible = false;
  }


  /**
   * Returns the name of the creator of the current channel.
   * @returns {string} Name of the channel creator or 'Unbekannt' if not found.
   */
  channelCreator(): string {
    const currentChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    if (!currentChannel) {
      return 'Unbekannt';
    }
    const owner = this.storage.user.find(user => user.id === currentChannel.owner);
    return owner?.name || '';
  }


  /**
   * Getter to retrieve the current channel ID.
   * @returns {string} Current channel ID.
   */
  get currentChannelId(): string {
    return this.storage.currentUser.currentChannel || '';
  }


  /**
   * Returns the description of the current channel.
   * @returns {string} Channel description.
   */
  channelDescription(): string {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.description || '';
  }


  /**
   * Trigger to open the channel member dialog.
   * @param {Event} event - The DOM event triggered by user interaction.
   */
  callOpenDialog(event: Event) {
    event.stopPropagation();
    if (this.channelMemberDialog) {
      this.channelMemberDialog.openDialog();
    } else {
      console.error("Error of call channelMemberDialog.openDialog()")
    }
  }

  /**
   * Returns the appropriate context ('channel', 'dm', 'newMessage', or '') based on the current channel setting.
   * @returns {"channel" | "dm" | "newMessage" | ""}
   */
  findChannel(): "channel" | "dm" | "newMessage" | "" {
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);
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


  /**
   * Returns the name of the current channel.
   * @returns {string} Name of the current channel.
   */
  channelName(): string {
    return (
      this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name || ''
    );
  }


  /**
   * Fetches and returns the list of users associated with the current channel.
   * @returns {Array<string>} Array of user IDs or an empty array if no users are found.
   */
  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }


  /**
   * Retrieves the avatar for a specific user.
   * @param {string} user - User ID for which to retrieve the avatar.
   * @returns {string} URL or path to the user's avatar.
   */
  findAvatar(user: string) {
    let avatar = this.storage.user.find(u => u.id === user)?.avatar;
    if (avatar) return avatar;
    else return '';
  }


  /**
   * Retrieves the avatar of a user involved in the current direct message.
   * @returns {string} URL or path to the user's avatar.
   */
  userAvatar() {
    let foundUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    let avatar: string = this.storage.user.find(user => user.id === foundUser)!.avatar;
    if (avatar) return avatar;
    else return '';
  }


  /**
   * Retrieves the name of a user involved in the current direct message.
   * @returns {string} Name of the user, or the current user's name appended with ' (Du)' if the current user is involved.
   */
  userName() {
    let foundUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm
      .find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    if (foundUser === this.storage.currentUser.id) return this.storage.currentUser.name + ' (Du)';
    else return this.storage.user.find(user => user.id === foundUser)?.name;
  }


  /**
   * Opens the dialog to add channel members.
   * @param {Event} event - The DOM event triggered by user interaction.
   */
  openAddChannelMemberDialog(event: Event) {
    event.stopPropagation();
    if (this.addChannelMemberDialog) {
      this.addChannelMemberDialog.openDialog();
    } else {
      console.error("Error of call channelMemberDialog.openDialog()")
    }
  }

}
