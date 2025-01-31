import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener, inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OpenUserProfileService } from '../../../services/open-user-profile.service';
import { UserInterface } from '../../../interfaces/user.interface';
import { Subscription } from 'rxjs';
import { CloudStorageService } from '../../../services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../services/open-close-dialog.service';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';

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

  isOpen: boolean = false;
  userId: string = "";
  user: UserInterface | undefined = undefined;
  mode: 'show' | 'edit' = 'show';
  email: string = '';
  name: string = '';
  message: string = '';
  avatar: string = '';
  currentProfilePicture: string = '';
  uploadFile: File | null = null;
  avatarChanged: boolean = false;
  inputFieldCheck: boolean = false;

  private subscriptions: Subscription = new Subscription();


  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    public openUserProfileService: OpenUserProfileService) {
    this.email = this.user?.email || '';
  }


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
   * Listens for changes in user profile ID and updates the user details accordingly.
   * @param {SimpleChanges} changes - Changes detected in component inputs.
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.openCloseDialogService.profileId.subscribe((userId) => {
      this.userId = userId;
      this.user = this.storage.user.find(u => u.id === this.userId);
    });
  }


  /**
   * Initializes by subscribing to dialog open/close states and user profile changes.
   */
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


  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  isCurrentUser(user: string) {
    return user === this.storage.currentUser.name
  }


  /**
   * Closes the user profile dialog.
   */
  closeDialog(): void {
    this.openCloseDialogService.close('userProfile');
    this.mode = 'show';
  }


  /**
   * Checks if the specified user is the current user.
   * @param {string} userId - The ID of the user to check.
   * @returns {boolean} True if the specified user is the current user, false otherwise.
   */
  userIsCurrentUser(userId: string): boolean {
    return userId === this.storage.currentUser.id
  }


  /**
   * Switches the component to edit mode, allowing the current user to update their profile.
   */
  changeToEditMode() {
    this.currentProfilePicture = this.storage.currentUser.avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + this.storage.currentUser.avatar : this.cloud.openImage(this.storage.currentUser.avatar);
    this.updateUser();
    this.mode = "edit"
  }


  /**
   * Updates the user details from storage for editing.
   */
  updateUser(): void {
    if (this.storage.currentUser) {
      this.email = this.storage.currentUser.email;
      this.name = this.storage.currentUser.name;
    }
  }


  /**
   * Opens the dialog for user profile.
   */
  public openDialog() {
    this.userId = this.storage.profileId || '';
    this.user = this.storage.user.find(u => u.id === this.userId);
    this.isOpen = true;
  }


  /**
   * Gets the display name of a user by their ID.
   * @param {string} userId - The user ID.
   * @returns {string} The user's name, or 'Unbekannt' if the user cannot be found.
   */
  getUserName(userId: string): string {
    const user = this.storage.user.find(u => u.id === userId);
    return user ? (user.id === this.storage.currentUser.id ? `${user.name} (Du)` : user.name) : 'Unbekannt';
  }


  /**
   * Finds and returns the avatar URL for a given user ID. If the avatar filename starts with 'profile-',
   * it constructs a path to a local profile picture. Otherwise, it retrieves the image from cloud storage.
   * 
   * @param {string} userId - The ID of the user whose avatar is being retrieved.
   * @returns {Promise<string>} A promise that resolves to the URL of the user's avatar.
   */
  async findAvatar(userId: string): Promise<string> {
    const avatar = this.storage.user.find(u => u.id === userId)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : this.cloud.openImage(avatar);
  }


  /**
   * Sends a direct message to a specified user and closes the user profile and channel member dialogs.
   * This method is typically triggered when a user initiates a direct message from the user profile UI.
   *
   * @param {string} userName - The name of the user to whom the message is being sent.
   */
  writeMessageToUser(userName: string) {
    this.openUserProfileService.showSubmittedDirectMessage(userName);
    this.closeDialog();
    this.openCloseDialogService.close('channelMember')
  }


  /**
  * Saves the updated profile and updates the session.
  */
  async saveProfile(): Promise<void> {
    this.resetCheckForm();
    await this.handleAvatarUpload();
    const updatedUser: Partial<UserInterface> = {
      name: this.name,
      email: this.email,
      avatar: this.avatar
    };
    await this.storage.updateUser(this.userId, updatedUser as UserInterface);
    await this.updateEmail();
    await this.auth.getCurrentUser();
    this.updateLocalUser();
    this.mode = "show";
  }


  /**
   * Processes the upload of the avatar, if necessary.
   */
  private async handleAvatarUpload(): Promise<void> {
    if (this.avatarChanged && this.uploadFile && this.storage.currentUser.id) {
      this.avatar = await this.cloud.uploadProfilePicture(this.storage.currentUser.id, this.uploadFile);
      this.uploadFile = null;
    } else {
      this.avatar = this.storage.currentUser.avatar;
    }
  }


  /**
   * Updates the local user data after saving.
   */
  private updateLocalUser(): void {
    if (this.user) {
      this.user.name = this.name;
      this.user.email = this.email;
      this.user.avatar = this.avatar;
    }
  }


  /**
   * Handles file input changes to select a user's profile picture.
   * @param {Event} event - The file input change event containing the selected file.
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
   * Sets the chosen picture as the current profile picture.
   * @param {string} path - The path to the selected image.
   */
  chosePicture(path: string) {
    this.currentProfilePicture = path;
    this.avatarChanged = true;
    this.avatar = path
  }


  /**
   * Triggers a file explorer to select a file.
   * @param {HTMLInputElement} fileInput - The file element to trigger. 
   */
  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }


  /**
  * Updates the user's email and handles related messages and logging.
  */
  async updateEmail(): Promise<void> {
    if (!this.isEmailValid()) return;

    try {
      await this.changeUserEmail(this.email);
      this.handleSuccess();
    } catch (error) {
      this.handleError(error);
    }
  }


  /**
   * Validates the email input and sets appropriate messages.
   * @returns {boolean} True if the email is valid, otherwise false.
   */
  private isEmailValid(): boolean {
    if (!this.email) {
      this.message = "Please enter a valid new email.";
      console.warn("No new email entered.");
      return false;
    }
    return true;
  }


  /**
   * Attempts to change the user's email using the authentication service.
   */
  private async changeUserEmail(newEmail: string): Promise<void> {
    await this.auth.changeUserEmail(newEmail);
  }


  /**
   * Handles successful email update by setting a success message and logging.
   */
  private handleSuccess(): void {
    this.message = "Email successfully changed! Please verify your new email.";
  }


  /**
   * Handles errors that occur during the email update process.
   * @param {any} error - The error object caught during the email update.
   */
  private handleError(error: any): void {
    this.message = "Error: " + error.message;
    console.error("Error changing email:", error.message);
  }


  /**
   * Checks if the input fields are valid by setting the focus of the input fields to true.
   */
  checkInputFields() {
    this.inputFieldCheck = true;
  }


  /**
   * Resets the inputFieldCheck variable, so that the error messages aren't showed.
   */
  resetCheckForm() {
    this.inputFieldCheck = false;
  }

}
