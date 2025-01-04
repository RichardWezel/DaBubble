import { NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, inject, Input, OnDestroy } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserInterface } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-add-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgStyle],
  templateUrl: './add-channel-member-dialog.component.html',
  styleUrl: './add-channel-member-dialog.component.scss'
})
export class AddChannelMemberDialogComponent {

  @Input() channelUsers: string[] = [];
  searchResult: UserInterface[] = [];
  userInput: string = "";
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isOpen: boolean = true;
  private subscriptions: Subscription = new Subscription();
  addedUser: UserInterface[] = [];
  isLoading: boolean = false; 
  errorMessage: string = ''; 
  successMessage: string = '';

  // Timer-Referenzen
  private successTimer: any;
  private errorTimer: any;
  private loadingTimer: any;

  constructor() { }

  /**
   * Subscribes to the status of addChannelMember in the openCloseDialogService and equates isOpen with the status.
   */
  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMember')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub) this.subscriptions.add(sub);
  }

  /**
   * Destroys all subscribtions and clears timer.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // clear Timer
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
  }

  /**
   * Sets property isOpen on true;
   */
  public openDialog() {
    this.isOpen = true;
  }

  /**
   * Sets property isOpen on false and clear all texts and inputs.
   */
  public closeDialog() {
    this.isOpen = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.addedUser = [];
    this.userInput = '';
  }

  /**
  * During input in the input field, the function “updateSuggestion” is called, which updates the suggested text in the background of input field.
  */
  onInput(): void {
    this.searchResult = [];
    this.updateSearchResult();
  }

  /**
   * Searches for the user in the user collection with the id of the entered user. If there is a match, the user name is returned.
   * 
   * @param user - Users Object
   * @returns {String} Username
   */
  getUserName(user: UserInterface): string {
    const foundUser = this.storage.user.find(u => u.id === user.id);
    return foundUser ? (foundUser.id === this.storage.currentUser.id ? `${foundUser.name} (Du)` : foundUser.name) : 'Unbekannt';
  }

  /**
   * Finds the path to the user's avatar using the id and returns the path to the image.
   * 
   * @param user - Users Object
   * @returns {String} path of picture
   */
  findAvatar(user: UserInterface): string {
    const avatar = this.storage.user.find(u => u.id === user.id)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : this.cloud.openImage(avatar);
  }

  /**
   * Finds the Channel witch is current used und returns the name.
   * 
   * @returns {String} name of current channel
   */
  channelName(): string {
    return (
      this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name || ''
    );
  }

  /**
   * If there is an input from the user, 
   * the setSearchresult function will return all users that match the input by name or e-mail address.
   * 
   * @returns any
   */
  updateSearchResult() {
    const trimmedInput = this.userInput.trim();
    if (!trimmedInput) {
      this.searchResult = [];
      return;
    }
    this.setSearchresult(trimmedInput);
  }

  /**
   * Sets the property searchResult with matched usern of user input.
   * 
   * @param trimmedInput - User input trimmed
   */
  setSearchresult(trimmedInput: any) {
    const searchTerm = trimmedInput.toLowerCase();
    this.searchResult = this.storage.user.filter(user => {
      const isAlreadyMember = this.channelUsers.includes(user.id!);
      return (
        !isAlreadyMember && // Benutzer ist noch kein Mitglied
        (
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        )
      );
    });
  }

  /**
   * Adds users to addedUser property who are not yet members of the channel. 
   * Empties the input field afterwards.
   * 
   * @param user - Users Object
   */
  markUser(user: UserInterface) {
    if (!this.addedUser.find(u => u.id === user.id)) {
      this.addedUser.push(user);
    }
    this.userInput = "";
    this.errorMessage = ''; // Reset Fehlermeldung bei erfolgreicher Auswahl
  }

  /**
   * Adds all selected users to the current channel.
   *
   * This asynchronous method performs the following actions:
   *
   * 1. **Check for Selected Users**:
   *    - Verifies if any users have been added to the `addedUser` list.
   *    - If no users are selected, sets an error message indicating that no users were selected and exits the method.
   *
   * 2. **Initialize Loading State**:
   *    - Calls `startValues()` to set up loading indicators and reset any existing messages.
   *
   * 3. **Attempt to Add Users**:
   *    - Calls the `addUser()` method to add the selected users to the channel.
   *    - Waits for the `addUser` operation to complete.
   *
   * 4. **Handle Errors**:
   *    - If an error occurs during the addition of users, catches the error and invokes `addErrorMessage(error)` to display an appropriate error message.
   *
   * 5. **Finalize Loading State**:
   *    - Regardless of success or failure, sets `isLoading` to `false` to stop any loading indicators.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves once the users have been processed for addition.
   *
   * @example
   * this.addUsers();
   * // Adds the selected users to the current channel and handles any potential errors.
   */
  async addUsers(): Promise<void> {
    if (this.addedUser.length === 0) {
      this.errorMessage = 'Es wurden keine Benutzer zum Hinzufügen ausgewählt.';
      return;
    }
    this.startValues();
    try {
      await this.addUser();
    } catch (error: any) {
      this.addErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }


  /**
   * Adds the selected users to the current channel.
   * 
   * This asynchronous method performs the following actions:
   * 
   * 1. **Retrieve Current Channel ID**:
   *    - Accesses the `currentChannel` property from the `currentUser` object within the `FirebaseStorageService`.
   * 
   * 2. **Validate Channel ID**:
   *    - Checks if the `currentChannelId` exists.
   *    - Throws an error with the message `'Aktueller Channel nicht gefunden.'` if the channel ID is not found.
   * 
   * 3. **Extract User IDs**:
   *    - Maps over the `addedUser` array to extract the `id` of each user.
   *    - Filters out any falsy values to ensure only valid user IDs are processed.
   * 
   * 4. **Add Users to Channel**:
   *    - Calls the `addUsersToChannel` method from the `FirebaseStorageService`, passing the `currentChannelId` and the array of `newUserIds`.
   *    - Awaits the completion of this asynchronous operation.
   * 
   * 5. **Display Success Message**:
   *    - Invokes the `showSuccessMessage` method to display a confirmation message indicating that users have been successfully added.
   * 
   * 6. **Update Channel Users**:
   *    - Merges the newly added user IDs into the existing `channelUsers` array to reflect the updated list of channel members.
   * 
   * 7. **Reset Component State**:
   *    - Clears the `addedUser` array to remove the users that were just added.
   *    - Resets the `userInput` string to an empty value, clearing the input field in the UI.
   * 
   * @async
   * @throws {Error} Throws an error if the current channel ID is not found.
   * @returns {Promise<void>} A promise that resolves once the users have been successfully added to the channel.
   */
  async addUser(): Promise<void> {
    const currentChannelId = this.storage.currentUser.currentChannel;
    if (!currentChannelId) {
      throw new Error('Aktueller Channel nicht gefunden.');
    }
    const newUserIds = this.addedUser.map(user => user.id!).filter(id => !!id);
    await this.storage.addUsersToChannel(currentChannelId, newUserIds);
    this.showSuccessMessage('Benutzer erfolgreich hinzugefügt!');
    this.channelUsers = [...this.channelUsers, ...newUserIds];
    this.addedUser = [];
    this.userInput = '';
  }

  /**
   * Adds the error-message to the dialog.
   * 
   * @param error 
   */
  addErrorMessage(error: any) {
    console.error('Fehler beim Hinzufügen der Benutzer:', error);
    this.showErrorMessage(error.message || 'Beim Hinzufügen der Benutzer ist ein Fehler aufgetreten.');
  }

  /**
   * Sets the start values and the Timeout of loading.
   */
  startValues() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.loadingTimer = setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  /**
   * Clears the timeout of loading.
   */
  stopLoading() {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    this.isLoading = false;
  }
  
  /**
   * Removes a user from the `addedUser` list.
   *
   * This method filters out the specified user from the `addedUser` array based on the user's ID.
   * It ensures that the user to be removed is no longer part of the selection for adding to the channel.
   *
   * @param {UserInterface} user - The user to be removed from the `addedUser` list.
   * @returns {void} This method does not return any value.
   *
   * @example
   * // Assuming `user` is an object with an `id` property
   * this.removeUser(user);
   * // The specified user will be removed from the `addedUser` array
   */
  removeUser(user: UserInterface): void {
    this.addedUser = this.addedUser.filter(u => u.id !== user.id);
  }


  /**
   * Displays a success message and automatically removes it after a specified duration.
   *
   * This method sets the `successMessage` property with the provided message,
   * making it visible in the UI. It then initiates a timer that clears the message
   * after 2 seconds, ensuring that the message is only displayed temporarily.
   *
   * @param {string} message - The success message to be displayed to the user.
   * @returns {void} This method does not return any value.
   *
   * @example
   * this.showSuccessMessage('Users have been successfully added!');
   * // Displays the success message and hides it after 2 seconds
   */
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    // Set a timer to remove the success message after 2 seconds
    this.successTimer = setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }


  /**
   * Displays an error message and automatically removes it after a specified duration.
   *
   * This method sets the `errorMessage` property with the provided message,
   * making it visible in the UI. It then initiates a timer that clears the message
   * after 2 seconds, ensuring that the message is only displayed temporarily.
   *
   * @param {string} message - The error message to be displayed to the user.
   * @returns {void} This method does not return any value.
   *
   * @example
   * this.showErrorMessage('Failed to add users. Please try again.');
   * // Displays the error message and hides it after 2 seconds
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    // Set a timer to remove the error message after 2 seconds
    this.errorTimer = setTimeout(() => {
      this.errorMessage = '';
    }, 2000);
  }


  /**
   * Clears both success and error messages and cleans up any active timers.
   *
   * This method resets the `successMessage` and `errorMessage` properties to empty strings,
   * effectively hiding any messages currently displayed to the user. Additionally, it checks
   * if there are active timers (`successTimer` and `errorTimer`) and clears them to prevent
   * any unintended behavior or memory leaks.
   *
   * @returns {void} This method does not return any value.
   *
   * @example
   * this.clearMessages();
   * // Clears any displayed success or error messages and stops their timers
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';

    // Clear the success message timer if it exists
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }

    // Clear the error message timer if it exists
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
  }
}