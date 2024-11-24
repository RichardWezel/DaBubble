import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { FormsModule } from '@angular/forms';
import { ChannelInterface } from '../../../../../shared/interfaces/channel.interface';
import { UserInterface } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-new-message-input-head',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-message-input-head.component.html',
  styleUrls: ['./new-message-input-head.component.scss']

})
export class NewMessageInputHeadComponent {

  protected storage = inject(FirebaseStorageService);
  userInput: string = ''; // Binding to input value
  suggestion: string = ''; // saves the current autocomplete

  /**
   * During input in the input field, the function “updateSuggestion” is called, which updates the suggested text in the background of input field.
   */
  onInput(): void {
    this.updateSuggestion();
  }

  /**
   * Finds a conditional match with usern, channel or e-mail and sets the default text for autocomplete.
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
   * Depending on the initial prefix, a function is called that returns a match with the entered term from the respective property array.
   * 
   * @param userInput - Input String of User
   * @returns 
   */
  findMatch(userInput: string): string | undefined {
    let prefix = userInput.slice(0, 1);
    if (prefix === '#') {
      return this.handleChannelSearch(userInput);
    }
    if (prefix === '@') {
      return this.handleUserSearch(userInput)
    }
    return undefined;
  }

  /**
   * If userInput starts with a #, the first channel name of the current user's channel is returned. 
   * If further inputs follow #, matching channel names of the current user are returned.  
   * 
   * @param userInput - Input String of User
   * @returns 
   */
  handleChannelSearch(userInput: string): string | undefined {
    let inputHasOnlyPrefix = userInput.length === 1;
    let ChannelsAssignedToCurrentUser = this.storage.CurrentUserChannel.length > 0;
    let firstChannelOfCurrentUser = this.storage.CurrentUserChannel[0].name;
    let userInputWithoutPrefix = userInput.slice(1);

    if (inputHasOnlyPrefix) {
      return ChannelsAssignedToCurrentUser ? firstChannelOfCurrentUser : undefined;
    } else {
      let searchTerm = userInputWithoutPrefix;
      return this.matchChannel(searchTerm);
    }
  }

  /**
   * If userInput starts with a @, the first User name is returned. 
   * If further inputs follow @, matching User names returned.  
   * 
   * @param userInput - Input String of User
   * @returns 
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
   * Finds the first match between the input content and the CurrentUserChannel array and returns it.
   * 
   * @param searchTerm - Input String of User
   * @returns 
   */
  matchChannel(searchTerm: string): string | undefined {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name;
  }

  /**
   * Finds the first match between the input content and the User array and returns it.
   * 
   * @param searchTerm 
   * @returns 
   */
  matchUser(searchTerm: string): string | undefined {
    let users: UserInterface[] = this.storage.user;
    let match = users.find(user =>
      user.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name;
  }

  /**
   * A getter that assembles the displayed text in the suggestion div. 
   * It combines the userInput with the rest of the suggestion to display the suggestion.
   */
  get displayText(): string {
    if (this.suggestion) {
      let prefix = this.userInput.charAt(0); // '#' oder '@'
      if ((prefix === '#' || prefix === '@') && this.userInput.length === 1) {
        return `${prefix}${this.suggestion}`;
      } else if (prefix === '#' || prefix === '@') {
        let searchTerm = this.userInput.slice(1); // Entferne '#' oder '@'
        let remaining = this.suggestion.slice(searchTerm.length);
        return `${this.userInput}${remaining}`;
      }
    }
    return this.userInput;
  }



  // FUNCTIONS FOR TRANSFERRING THE SUGGESTION TO THE CHANNEL DISPLAY

  /**
     * Accepts the destination suggestion when the Enter or Tab key is pressed.
     * 
     * @param event 
     */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.suggestion ||
      event.key === 'Enter' && this.suggestion) {

      this.handleSubmitSuggestion(event)
    }
  }

  handleSubmitSuggestion(event: KeyboardEvent) {
    event.preventDefault();
    this.acceptSuggestion();
    this.showSuggestion();
    let searchTerm = this.userInput.slice(1); // Entferne '#' oder '@'
  }

  /**
  * Sets the userInput to the suggestion found and empties the suggestion.
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
  }

  /**
   * Depending on whether # or @ is at the beginning of the input field, 
   * the channel of the currentUser is set to the entered channel or direct message 
   * so that it is displayed.
   */
  async showSuggestion() {
    let prefix = this.userInput.charAt(0);
    let searchTerm = this.userInput.slice(1);
    if (prefix === '#') {
      let foundChannelId = this.findChannelId(searchTerm);
      this.storage.setChannel(foundChannelId);
    }
    if (prefix === '@') {
      // UserOfSuggestion entspricht dem Objekt in user collection, welches mit dem serchTerm überienstimmt
      // avatar: "profile-5.png"
      // email: "ichbinelias@beispiel.com"
      // id: "BnmpU2U2CzA671AY4tms"
      // name: "Elias Neumann"
      // online: true
      const UserOfSuggestion = this.storage.user.find(user => user.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
      console.log(UserOfSuggestion);
      if (UserOfSuggestion && this.findUserInDms(UserOfSuggestion)) {
        let dmsOfCurrentUser = this.storage.currentUser.dm;
        let dmWithUserOfSuggestion = dmsOfCurrentUser.find(dm => dm.contact === UserOfSuggestion.id);
        this.storage.setChannel(dmWithUserOfSuggestion!.id);
      } else if (UserOfSuggestion && !this.findUserInDms(UserOfSuggestion) && this.storage.currentUser.id && UserOfSuggestion.id) {
        console.log(UserOfSuggestion.id);
        await this.storage.createNewEmptyDm(this.storage.currentUser.id, UserOfSuggestion.id);
        await this.storage.createNewEmptyDm(UserOfSuggestion.id, this.storage.currentUser.id);
        let dmWithUserOfSuggestion = this.storage.currentUser.dm.find(dm => dm.contact === UserOfSuggestion.id);
        if (dmWithUserOfSuggestion) this.storage.setChannel(dmWithUserOfSuggestion!.id);
      }
    }
  }

  findUserInDms(UserOfsuggestion: UserInterface): boolean {
    return this.storage.currentUser.dm.some(dm => dm.contact === UserOfsuggestion.id);
  }

  findUserInCurrentUserDms(foundUser: UserInterface) {
    let match = this.storage.currentUser.dm.find(user => user.id === foundUser.id);
    return match
  }

  /**
   * Matches the input with the names of the channels of the current user and returns the id of the matching channel.
   * 
   * @param searchTerm - string of input content
   * @returns - id of channel is matched with input
   */
  findChannelId(searchTerm: string): string {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
    return match?.id!;
  }

  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }

  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }


}