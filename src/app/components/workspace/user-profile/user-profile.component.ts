import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit, OnDestroy {

  @Input() channelUsers: string[] = [];

  storage = inject(FirebaseStorageService)
  isUserProfileVisible = true;
  userId: string = "";
  userObject: UserInterface | undefined = undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(public openUserProfileService: OpenUserProfileService) { }

  ngOnInit(): void {
    const isOpenSub = this.openUserProfileService.isOpen$.subscribe(value => {
      this.isUserProfileVisible = value;
      console.log('isDialogVisible changed to:', value);
    });

    const userIdSub = this.openUserProfileService.userID$.subscribe(value => {
      this.userId = value;
      this.updateUser(this.userId)
      console.log('userId changed to:', value);
    });

    
    console.log('userObject:', this.userObject);

    this.subscriptions.add(isOpenSub);
    this.subscriptions.add(userIdSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateUser(userId: string) {
    let userData = this.storage.user.find(user => user.id === userId);
    this.userObject = userData;
    console.log('UserProfileComponent userObject is updated to: ', this.userObject)
  }

  public openDialog() {
    this.isUserProfileVisible = true;
  }

  public closeDialog() {
    this.isUserProfileVisible = false;
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

  writeMessageToUser (userName: string) {
    this.openUserProfileService.showSubmittedDirectMessage(userName);
    this.closeDialog();
  }

}
