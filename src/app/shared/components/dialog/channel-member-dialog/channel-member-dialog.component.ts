import { NgFor, NgIf } from '@angular/common';
import { Component, inject, HostListener } from '@angular/core';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { CloudStorageService } from '../../../services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { MemberContainerComponent } from '../../member-container/member-container.component';

@Component({
  selector: 'app-channel-member-dialog',
  standalone: true,
  imports: [NgIf, MemberContainerComponent],
  templateUrl: './channel-member-dialog.component.html',
  styleUrl: './channel-member-dialog.component.scss'
})
export class ChannelMemberDialogComponent {

  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();


  constructor() { }


  /**
   * Closes the dialog by click on esc key.
   * 
   * @param event - click escape Key
   */
  @HostListener('document:keydown.escape', ['$event']) 
  handleEscape(event: KeyboardEvent) {
    if (this.isOpen) {
      this.closeDialog();
    }
  }


  /**
   * Subscribes to the dialog service to listen for open/close events.
   */
  ngOnInit(): void {
    const sub1 = this.openCloseDialogService
      .isDialogOpen('channelMember')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub1) this.subscriptions.add(sub1);
  }


  /**
   * Unsubscribes from all subscriptions on component destruction to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
      console.log('User ', userID, ' is clicked to open the respective dialogue!');
    }
  }


  /**
   * Opens the channel member dialog.
   */
  public openDialog() {
    this.isOpen = true;
  }


  /**
   * Closes the channel member dialog.
   */
  public closeDialog() {
    this.isOpen = false;
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
  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }
}
