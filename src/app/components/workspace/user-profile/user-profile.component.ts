import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {

  @Input() channelUsers: string[] = []; 

  storage = inject(FirebaseStorageService)
  isDialogVisible = true;

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
