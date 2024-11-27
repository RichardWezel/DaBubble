import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {

  constructor(private openUserProfileService: OpenUserProfileService) {
    this.openUserProfileService.isOpen$.subscribe(value => this.isDialogVisible = value);
    this.openUserProfileService.userName$.subscribe(value => this.userId = value);
    this.updateUser(this.userId);
  }

  @Input() channelUsers: string[] = []; 

  storage = inject(FirebaseStorageService)
  isDialogVisible = true;
  userId: string = "";
  userObject: UserInterface | undefined = undefined;

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

  updateUser(userId: string) {
    let userData = this.storage.user.find(user => user.id === userId);
    this.userObject = userData;
  }

}
