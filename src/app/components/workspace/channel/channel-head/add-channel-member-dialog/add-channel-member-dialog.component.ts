import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './add-channel-member-dialog.component.html',
  styleUrl: './add-channel-member-dialog.component.scss'
})
export class AddChannelMemberDialogComponent {

  @Input() channelUsers: string[] = [];
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor() { }

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMember')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub) this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public openDialog() {
    this.isOpen = true;
  }

  public closeDialog() {
    this.isOpen = false;
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
