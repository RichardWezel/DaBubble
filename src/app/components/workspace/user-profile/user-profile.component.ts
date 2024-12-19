import { NgClass, NgIf } from '@angular/common';
import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { Subscription } from 'rxjs';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../shared/services/open-close-dialog.service';
import { FormsModule } from '@angular/forms';
import { FirebaseAuthService } from '../../../shared/services/firebase-auth.service';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgIf, NgClass, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit, OnDestroy, OnChanges {
  cloud = inject(CloudStorageService);
  storage = inject(FirebaseStorageService);
  auth = inject(FirebaseAuthService);


  @Input() channelUsers: string[] = [];

  isOpen: boolean = false;
  userId: string = "";
  user: UserInterface | undefined = undefined;
  mode: string = "show";
  email: string = '';
  name: string = '';
  avatar: string = '';
  currentProfilePicture: string = '';
  uploadFile: File | null = null;
  avatarChanged: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    public openUserProfileService: OpenUserProfileService) {
  }


  ngOnChanges(changes: SimpleChanges): void {
    this.openCloseDialogService.profileId.subscribe((userId) => {
      this.userId = userId;
      this.user = this.storage.user.find(u => u.id === this.userId);
    });
  }

  isCurrentUser(user: string) {
    return user === this.storage.currentUser.name
  }

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('userProfile')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    const subscription = this.openCloseDialogService.profileId.subscribe((userId) => {
      this.userId = userId;
      this.user = this.storage.user.find(u => u.id === this.userId);
    });
    if (sub) this.subscriptions.add(sub);
    if (subscription) this.subscriptions.add(subscription);
  }



  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeDialog(): void {
    this.openCloseDialogService.close('userProfile');
  }

  userIsCurrentUser(userId: string): boolean {
    return userId === this.storage.currentUser.id
  }

  changeToEditMode() {
    this.currentProfilePicture = this.storage.currentUser.avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + this.storage.currentUser.avatar : this.cloud.openImage(this.storage.currentUser.avatar);
    this.updateUser();
    this.mode = "edit"
  }

  updateUser(): void {
    if (this.storage.currentUser) {
      this.email = this.storage.currentUser.email;
      this.name = this.storage.currentUser.name;
    }
  }

  public openDialog() {
    this.userId = this.storage.profileId || '';
    this.user = this.storage.user.find(u => u.id === this.userId);
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
      : this.cloud.openImage(avatar);
  }

  writeMessageToUser(userName: string) {
    this.openUserProfileService.showSubmittedDirectMessage(userName);
    this.closeDialog();
    this.openCloseDialogService.close('channelMember')
  }

  async saveProfile(): Promise<void> {

    if (this.avatarChanged && this.uploadFile && this.storage.currentUser.id) {
      this.avatar = await this.cloud.uploadProfilePicture(this.storage.currentUser.id, this.uploadFile);
      this.uploadFile = null;
    } else {
      this.avatar = this.storage.currentUser.avatar;
    }

    const updatedUser: Partial<UserInterface> = {
      name: this.name,
      email: this.email,
      avatar: this.avatar
    };

    await this.storage.updateUser(this.userId, updatedUser as UserInterface);
    this.auth.getCurrentUser();
  }


  /**
 * This method selects a picture from the file explorer.
 * @param event - The file input change event that contains the selected file.
 */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = () => this.chosePicture(reader.result as string);
      reader.readAsDataURL(file);
      this.uploadFile = file;
    }
  }


  /**
 * The chosen picture from the selection gets saved as the currentProfilePicture and in the signInService.
 * @param path 
 */
  chosePicture(path: string) {
    this.currentProfilePicture = path;
    this.avatarChanged = true;
    this.avatar = path
  }


  /**
   * Triggers a click event on the provided file input element to open the file explorer.
   * @param fileInput 
   */
  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }
}