import { NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, inject, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { CloudStorageService } from '../../../services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { UserInterface } from '../../../interfaces/user.interface';

@Component({
  selector: 'app-add-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgStyle],
  templateUrl: './add-channel-member-dialog.component.html',
  styleUrl: './add-channel-member-dialog.component.scss'
})
export class AddChannelMemberDialogComponent {

  channelUsers: string[] = [];
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

  // Timer-References
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

    this.channelUsers = this.channelUser();
  }

  /**
   * Fetches and returns the list of users associated with the current channel.
   * @returns {Array<string>} Array of user IDs or an empty array if no users are found.
   */
  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
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
   * The method performs the following steps:
   * 1. Checks if any users have been added to the `addedUser` list. Exits if no users are selected.
   * 2. Initializes the loading state by setting up indicators and resetting messages.
   * 3. Attempts to add users using `addUser()` and waits for completion.
   * 4. Catches and displays errors if the addition fails.
   * 5. Finalizes the loading state by disabling indicators.
   * 
   * @async
   * @returns {Promise<void>} Resolves once the users have been processed for addition.
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
   * Adds selected users to the current channel.
   * 
   * The method performs the following steps:
   * 1. Retrieves and validates the current channel ID.
   * 2. Extracts and filters user IDs from the `addedUser` array.
   * 3. Calls `addUsersToChannel` to add users and awaits the operation.
   * 4. Displays a success message and updates the channel users list.
   * 5. Resets component state after adding users.
   * 
   * @async
   * @throws {Error} If the current channel ID is not found.
   * @returns {Promise<void>} Resolves after users are added to the channel.
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
