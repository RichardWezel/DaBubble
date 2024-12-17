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
  storage = inject(FirebaseStorageService);


  @Input() channelUsers: string[] = [];

  isOpen: boolean = false;
  userId: string = "";
  userObject: UserInterface | undefined = undefined;
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
    this.currentProfilePicture = this.storage.currentUser.avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + this.storage.currentUser.avatar : this.cloud.openImage(this.storage.currentUser.avatar);
    this.mode = "edit"
  }

  updateUser(userId: string): void {
    let userData = this.storage.user.find(user => user.id === userId);
    this.userObject = userData;
    if (this.userObject) {
      this.email = this.userObject.email;
      this.name = this.userObject.name;
    }
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

    await this.storage.updateUser(this.userId, updatedUser as UserInterface)
      .then(() => {
        this.userObject!.name = this.name;
        this.userObject!.email = this.email;
        this.mode = 'show';
      })
      .catch(error => {
        console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
      });
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