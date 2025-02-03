import { Component, inject, Input } from '@angular/core';
import { OpenCloseDialogService } from '../../services/open-close-dialog.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { CloudStorageService } from '../../services/cloud-storage.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-member-container',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './member-container.component.html',
  styleUrl: './member-container.component.scss'
})
export class MemberContainerComponent {

  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);

  @Input() dialog: boolean = false;


  constructor() { }


  /**
   * Closes the channel member dialog.
   */
  public closeChannelMemberDialog() {
    this.openCloseDialogService.close('channelMember');
  }


  /**
   * Opens the user profile dialog for a specific user.
   *
   * @param {string} userID - ID of the clicked user.
   */
  async openUserProfile(userID: string) {
    if (userID !== this.storage.currentUser.id) {
      this.openCloseDialogService.changeProfileId(userID);
      this.openCloseDialogService.open('userProfile');
    }
  }


  /**
   * Opens the add channel member dialog.
   *
   * @param {Event} event - Event object to prevent propagation.
   */
  public openAddChannelMemberDialog(event: Event) {
    event.stopPropagation();
    this.openCloseDialogService.open('addChannelMember');
  }


  /**
   * Closes the add channel member dialog.
   */
  public closeAddChannelMemberDialog() {
    this.openCloseDialogService.close('addChannelMember');
  }


  /**
   * Retrieves a user's name, or returns 'Unbekannt' if the user is not found.
   *
   * @param {string} userId - ID of the user to find.
   * @returns {string} The name of the user or 'Unbekannt'.
   */
  getUserName(userId: string): string {
    const user = this.storage.user.find(u => u.id === userId);
    return user ? (user.id === this.storage.currentUser.id ? `${user.name} (Du)` : user.name) : 'Unbekannt';
  }


  /**
   * Finds the avatar for a user and constructs the path or URL to it.
   *
   * @param {string} userId - ID of the user whose avatar is to be found.
   * @returns {string} Path or URL to the user's avatar.
   */
  findAvatar(userId: string): string {
    const avatar = this.storage.user.find(u => u.id === userId)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : this.cloud.openImage(avatar);
  }


  /**
   * Fetches and returns the list of users associated with the current channel.
   * @returns {Array<string>} Array of user IDs or an empty array if no users are found.
   */
  channelUser(): Array<string> {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }
}
