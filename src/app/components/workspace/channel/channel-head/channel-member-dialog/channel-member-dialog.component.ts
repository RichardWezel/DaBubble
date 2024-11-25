import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './channel-member-dialog.component.html',
  styleUrl: './channel-member-dialog.component.scss'
})
export class ChannelMemberDialogComponent {
  storage = inject(FirebaseStorageService)
  isDialogVisible = false;

  public openDialog() {
    this.isDialogVisible = true;
  }

  public closeDialog() {
    this.isDialogVisible = false;
  }

  getUserName(userId: string): string {
    const user = this.storage.user.find(u => u.id === userId);
    return user ? (user.id === this.storage.currentUser.id ? `${user.name} (Du)` : user.name) : 'Unbekannt';
  }

  findAvatar(userId: string): string {
    const avatar = this.storage.user.find(u => u.id === userId)?.avatar || '';
    return avatar.startsWith('profile-') 
      ? `assets/img/profile-pictures/${avatar}` 
      : this.storage.openImage(avatar);
  }

}
