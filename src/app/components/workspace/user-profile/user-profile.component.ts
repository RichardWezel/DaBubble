import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { Subscription } from 'rxjs';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../shared/services/open-close-dialog.service';
import { NgForm, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgIf, NgClass, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit, OnDestroy {
  cloud = inject(CloudStorageService);


  @Input() channelUsers: string[] = [];

  storage = inject(FirebaseStorageService)
  isOpen: boolean = false;
  userId: string = "";
  userObject: UserInterface | undefined = undefined;
  mode: string = "show";
  email: string = '';
  name: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    public openUserProfileService: OpenUserProfileService) {}

    isCurrentUser(user: string) {
      return user === this.storage.currentUser.name

    }
  
  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('userProfile')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub) this.subscriptions.add(sub);

    const userIdSub = this.openUserProfileService.userID$.subscribe(value => {
      this.userId = value;
      this.updateUser(this.userId)
      console.log('userId changed to:', value);
    });
    if (userIdSub) this.subscriptions.add(userIdSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeDialog(): void {
    this.openCloseDialogService.close('userProfile');
  }

  userIsCurrentUser() {
    return this.userId === this.storage.currentUser.id
  }

  changeToEditMode() {
    this.mode = "edit"
  }

  updateUser(userId: string): void {
    let userData = this.storage.user.find(user => user.id === userId);
    this.userObject = userData;
    if (this.userObject) {
      this.email = this.userObject.email;
      this.name = this.userObject.name;
    }
    console.log('UserProfileComponent userObject is updated to: ', this.userObject)
  }

  public openDialog() {
    this.isOpen = true;
  }

  getUserName(userId: string): string {
    const user = this.storage.user.find(u => u.id === userId);
    return user ? (user.id === this.storage.currentUser.id ? `${user.name} (Du)` : user.name) : 'Unbekannt';
  }

  async findAvatar(userId: string): Promise<string> {
    const avatar = this.storage.user.find(u => u.id === userId)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : await this.cloud.openImage(avatar);
  }

  writeMessageToUser(userName: string) {
    this.openUserProfileService.showSubmittedDirectMessage(userName);
    this.closeDialog();
    this.openCloseDialogService.close('channelMember')
  }

  async saveProfile(): Promise<void> {
    if (!this.userObject) {
      console.error('Kein Benutzerobjekt gefunden.');
      return;
    }
  
    const updatedUser: Partial<UserInterface> = {
      name: this.name,
      email: this.email
    };
  
    await this.storage.updateUser(this.userId, updatedUser as UserInterface)
      .then(() => {
        console.log('Benutzerprofil erfolgreich aktualisiert.');
        this.userObject!.name = this.name;
        this.userObject!.email = this.email;
        this.mode = 'show';
      })
      .catch(error => {
        console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      });
  }
}