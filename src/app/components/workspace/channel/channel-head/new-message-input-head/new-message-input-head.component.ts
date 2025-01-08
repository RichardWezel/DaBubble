import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { FormsModule } from '@angular/forms';
import { ChannelInterface } from '../../../../../shared/interfaces/channel.interface';
import { UserInterface } from '../../../../../shared/interfaces/user.interface';
import { NavigationService } from '../../../../../shared/services/navigation.service';

@Component({
  selector: 'app-new-message-input-head',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-message-input-head.component.html',
  styleUrls: ['./new-message-input-head.component.scss']

})
export class NewMessageInputHeadComponent {

  protected storage = inject(FirebaseStorageService);
  navigationService: NavigationService = inject(NavigationService);
  userInput: string = ''; // Binding to input value
  suggestion: string = ''; // saves the current autocomplete


  /**
   * Handles the input change event and updates the autocomplete suggestion.
   */
  onInput(): void {
    this.updateSuggestion();
  }


  /**
   * Updates the autocomplete suggestions based on the user input.
   */
  updateSuggestion(): void {
    if (this.userInput) {
      let match = this.findMatch(this.userInput);
      this.suggestion = match || '';
    } else {
      this.suggestion = '';
    }
  }


  /**
   * Searches for a match in channels, users, or emails based on the prefix and user input.
   * @param userInput - The input string from the user.
   * @returns A matching string or undefined if no match is found.
   */
  findMatch(userInput: string): string | undefined {
    let prefix = userInput.slice(0, 1);
    if (prefix === '#') {
      return this.handleChannelSearch(userInput);
    }
    if (prefix === '@') {
      return this.handleUserSearch(userInput)
    }
    if (!(prefix === '@') && !(prefix === '#')) {
      return this.handleEmailSearch(userInput)
    }
    return undefined;
  }


  /**
   * Searches for channels based on the user input.
   * @param userInput - The input string including the '#' prefix.
   * @returns The matched channel name or undefined if no match is found.
   */
  handleChannelSearch(userInput: string): string | undefined {
    let inputHasOnlyPrefix = userInput.length === 1;
    let channelsAssignedToCurrentUser = this.storage.CurrentUserChannel.length > 0;
    let firstChannelOfCurrentUser = this.storage.CurrentUserChannel[0].name;
    let userInputWithoutPrefix = userInput.slice(1);

    if (inputHasOnlyPrefix) {
      return channelsAssignedToCurrentUser ? firstChannelOfCurrentUser : undefined;
    } else {
      let searchTerm = userInputWithoutPrefix;
      return this.matchChannel(searchTerm);
    }
  }


  /**
   * Searches for users based on the user input.
   * @param userInput - The input string including the '@' prefix.
   * @returns The matched user name or undefined if no match is found.
   */
  handleUserSearch(userInput: string): string | undefined {
    if (userInput.length === 1) {
      return this.storage.user.length > 0 ? this.storage.user[0].name : undefined;
    } else {
      let searchTerm = userInput.slice(1);
      return this.matchUser(searchTerm);
    }
  }

  /**
   * Searches for emails matching the user input.
   * @param userInput - The user input string.
   * @returns The matched email or undefined if no match is found.
   */
  handleEmailSearch(userInput: string): string | undefined {
    return this.matchEmail(userInput);
  }


  /**
   * Finds the first matching channel name from the storage based on the search term.
   * @param searchTerm - The search term provided by the user.
   * @returns The name of the matched channel or undefined.
   */
  matchChannel(searchTerm: string): string | undefined {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name;
  }


  /**
   * Finds the first matching user name from the storage based on the search term.
   * @param searchTerm - The search term provided by the user.
   * @returns The name of the matched user or undefined.
   */
  matchUser(searchTerm: string): string | undefined {
    let users: UserInterface[] = this.storage.user;
    let match = users.find(user =>
      user.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name;
  }

  /**
   * Finds the first matching email from the storage based on the search term.
   * @param searchTerm - The search term provided by the user.
   * @returns The email of the matched user or undefined.
   */
  matchEmail(searchTerm: string): string | undefined {
    let users: UserInterface[] = this.storage.user;
    let match = users.find(user =>
      user.email.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.email;
  }


  /**
   * Constructs the display text for the suggestion box by combining user input with the suggestion.
   * @returns The full text to be displayed in the suggestion box.
   */
  get displayText(): string {
    if (!this.suggestion) {
      return this.userInput;
    }
    return this.handleUserInputForSuggestionText();
  }


  handleUserInputForSuggestionText() {
    const prefix = this.userInput.charAt(0);
    const inputHasOnlyPrefix = this.userInput.length === 1;
    const hasPrefix = prefix === '#' || prefix === '@';
    if (hasPrefix) {
      if (inputHasOnlyPrefix) {
        return `${prefix}${this.suggestion}`;
      } else {
        return this.returnUserInputWithRemainingTerm();
      }
    } else {
      return this.suggestion;
    }
  }


  /**
   * Combines the user input with the remaining part of the suggestion to complete the input string.
   * This method is used after a prefix is recognized to append the rest of a partially typed suggestion.
   *
   * @returns {string} The complete string combining the user input with the remaining term from the suggestion.
   */
  returnUserInputWithRemainingTerm() {
    const searchTerm = this.userInput.slice(1);
    const remainingTerm = this.suggestion.slice(searchTerm.length);
    return `${this.userInput}${remainingTerm}`;
  }


  // FUNCTIONS FOR TRANSFERRING THE SUGGESTION TO THE CHANNEL DISPLAY


  /**
   * Accepts and renders user input for channels or users by handling the Tab or Enter key events.
   * @param event - The keyboard event triggered by the user.
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.suggestion ||
      event.key === 'Enter' && this.suggestion) {
      this.handleSubmitSuggestion(event)
    }
  }


  /**
   * Submits the selected autocomplete suggestion, updates the input field, and performs the display action.
   * @param event - The keyboard event that triggered the submit.
   */
  handleSubmitSuggestion(event: KeyboardEvent) {
    event.preventDefault();
    this.acceptSuggestion();
    this.showSuggestion();
  }


  /**
   * Accepts the autocomplete suggestion based on the prefix and updates the input field accordingly.
   * Prefixes include '#' for channels and '@' for user mentions.
   */
  acceptSuggestion(): void {
    if (this.userInput.startsWith('#')) {
      this.userInput = `#${this.suggestion}`;
    } else if (this.userInput.startsWith('@')) {
      this.userInput = `@${this.suggestion}`;
    } else {
      this.userInput = this.suggestion;
    }
    this.suggestion = '';
    console.log('acceptSuggestion(), userInput: ', this.userInput);
    console.log('acceptSuggestion(), suggestion: ', this.suggestion);
  }


  /**
   * Displays the autocomplete suggestion by setting the appropriate channel or direct message.
   * Calls specific methods based on whether the input starts with '#' (channel) or '@' (direct message).
   */
  showSuggestion() {
    let prefix = this.userInput.charAt(0);
    let searchTerm = this.userInput.slice(1);
    if (prefix === '#') {
      this.showSubmittedChannel(searchTerm);
    } else if (prefix === '@') {
      this.showSubmittedDirectMessage(searchTerm);
    } else if (prefix) {
      this.showSubmittedEmail()
      console.log('showSuggestion(), userInput: ', this.userInput);
      console.log('showSuggestion(), suggestion', this.suggestion);
    }
  }


  /**
   * Sets the active channel to the one submitted by the user.
   * @param {string} searchTerm - The name of the channel as submitted by the user.
   */
  showSubmittedChannel(searchTerm: string) {
    let foundChannelId = this.findChannelId(searchTerm);
    this.navigationService.setChannel(foundChannelId);
  }


  /**
   * Displays an existing or creates a new direct message based on the submitted user name.
   * @param {string} searchTerm - The name of the user as submitted by the user.
   */
  showSubmittedDirectMessage(searchTerm: string) {
    const userOfSuggestion = this.storage.user.find(user => user.name.toLowerCase().startsWith(searchTerm.toLowerCase()));

    if (userOfSuggestion && this.findUserInDms(userOfSuggestion)) {
      this.showExistingDm(userOfSuggestion)
    } else if (userOfSuggestion && !this.findUserInDms(userOfSuggestion)) {
      this.showNewDm(userOfSuggestion)
    }
  }


  /**
   * Displays an existing direct message session if available.
   * @param {UserInterface} userOfSuggestion - The user with whom the direct message session exists.
   */
  showExistingDm(userOfSuggestion: UserInterface) {
    let dmsOfCurrentUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm;
    let dmWithUserOfSuggestion = dmsOfCurrentUser?.find(dm => dm.contact === userOfSuggestion.id);
    this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
  }


  /**
   * Creates and displays a new direct message session with the suggested user.
   * @param {UserInterface} userOfSuggestion - The user to create a new direct message session with.
   */
  async showNewDm(userOfSuggestion: UserInterface) {
    await this.createEmptyDms(userOfSuggestion);
    let dmWithUserOfSuggestion = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(dm => dm.contact === userOfSuggestion.id);
    if (dmWithUserOfSuggestion) this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
  }


  /**
   * Displays an email as a direct message if applicable.
   */
  showSubmittedEmail() {
    const userOfSuggestion = this.storage.user.find(user => user.email.startsWith(this.userInput.toLowerCase()));
    if (userOfSuggestion && this.findUserInDms(userOfSuggestion)) {
      this.showExistingDmEmail(userOfSuggestion)
    } else if (userOfSuggestion && !this.findUserInDms(userOfSuggestion)) {
      this.showNewDmEmail(userOfSuggestion)
    }
  }


  /**
   * Displays an existing email direct message session if available.
   * @param {UserInterface} userOfSuggestion - The user with whom the direct message session exists based on email.
   */
  showExistingDmEmail(userOfSuggestion: UserInterface) {
    let dmsOfCurrentUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm;
    let dmWithUserOfSuggestion = dmsOfCurrentUser?.find(dm => dm.contact === userOfSuggestion.id);
    this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
  }


  /**
   * Creates and displays a new direct message session with the suggested user based on email.
   * @param {UserInterface} userOfSuggestion - The user to create a new direct message session with based on email.
   */
  async showNewDmEmail(userOfSuggestion: UserInterface) {
    console.log('showNewDmEmail(userOfSuggestion: UserInterface): ', userOfSuggestion)
    await this.createEmptyDms(userOfSuggestion);
    let dmWithUserOfSuggestion = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(dm => dm.contact === userOfSuggestion.id);
    if (dmWithUserOfSuggestion) this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
  }


  /**
   * Creates empty direct message entries for initiating contact between the current user and the suggested user.
   * @param {UserInterface} userOfSuggestion - The user to initiate a direct message session with.
   */
  async createEmptyDms(userOfSuggestion: UserInterface) {
    let currentUserId = this.storage.currentUser.id;
    let suggestedUserId = userOfSuggestion.id;
    if (currentUserId && suggestedUserId) {
      await this.storage.createNewEmptyDm(currentUserId, suggestedUserId);
      await this.storage.createNewEmptyDm(suggestedUserId, currentUserId);
    }
  }


  /**
   * Checks if there is an existing direct message session with the suggested user.
   * @param {UserInterface} userOfSuggestion - The user to check for an existing direct message session.
   * @returns {boolean} True if a direct message session exists, otherwise false.
   */
  findUserInDms(userOfSuggestion: UserInterface): boolean {
    let match = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.some(dm => dm.contact === userOfSuggestion.id);
    if (match) return true;
    else return false;
  }


  /**
   * Searches for an existing direct message session within the current user's direct messages with a specified user.
   * @param {UserInterface} foundUser - The user to search for within the current user's direct messages.
   * @returns {Object} The direct message session if found, otherwise undefined.
   */
  findUserInCurrentUserDms(foundUser: UserInterface) {
    let match = this.storage.user.find(user => user.id === this.storage.currentUser.id)?.dm.find(user => user.id === foundUser.id);
    return match
  }


  /**
   * Matches the input with the names of the channels of the current user and returns the id of the matching channel.
   * @param {string} searchTerm - String of input content used to match channel names.
   * @returns {string} The id of the channel that matches the input, if any.
   */
  findChannelId(searchTerm: string): string {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
    return match?.id!;
  }


  /**
   * Retrieves the name of the channel that the current user is currently in.
   * @returns {string} The name of the current channel, if any.
   */
  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }


  /**
   * Retrieves the list of users associated with the current user's active channel.
   * @returns {UserInterface[]} A list of users in the current channel, or an empty array if no users are found.
   */
  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }

}
