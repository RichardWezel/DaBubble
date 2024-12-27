import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, ViewChild } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './channel-member-dialog.component.html',
  styleUrl: './channel-member-dialog.component.scss'
})
export class ChannelMemberDialogComponent {

  @Input() channelUsers: string[] = [];
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();
  constructor() { }

  ngOnInit(): void {
    const sub1 = this.openCloseDialogService
      .isDialogOpen('channelMember')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub1) this.subscriptions.add(sub1);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * The user ID of the user clicked on is transferred via the open-user-service
   *  and saved in a property in the service called userIDSource. 
   * The dialogue of the profile with the data of the clicked user is then opened.
   * 
   * @param {string} userID - ID of clicked User
   */
  async openUserProfile(userID: string) {
    if (userID !== this.storage.currentUser.id) {
      this.openCloseDialogService.changeProfileId(userID);
      this.openCloseDialogService.open('userProfile');
      console.log('User ', userID, ' is clicked to open the respective dialogue!');
    }
  }

  public openDialog() {
    this.isOpen = true;
  }

  public closeDialog() {
    this.isOpen = false;
  }

  public openAddChannelMemberDialog(event: Event) {
    event.stopPropagation();
    this.openCloseDialogService.open('addChannelMember');
  }

  public closeAddChannelMemberDialog() {
    this.openCloseDialogService.close('addChannelMember');
  }

  getUserName(userId: string): string {
    const user = this.storage.user.find(u => u.id === userId);
    return user ? (user.id === this.storage.currentUser.id ? `${user.name} (Du)` : user.name) : 'Unbekannt';
  }

  findAvatar(userId: string): string {
    const avatar = this.storage.user.find(u => u.id === userId)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : this.cloud.openImage(avatar);
  }

}
