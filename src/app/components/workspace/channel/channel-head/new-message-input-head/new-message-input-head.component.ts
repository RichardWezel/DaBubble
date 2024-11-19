import { Component, inject, ViewChild, ElementRef, NgModule } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { CurrentUserInterface } from '../../../../../shared/interfaces/current-user-interface';
import { ChannelInterface } from '../../../../../shared/interfaces/channel.interface';
import { UserInterface } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-new-message-input-head',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-message-input-head.component.html',
  styleUrl: './new-message-input-head.component.scss'
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
   * 
   * 
   * @param userInput 
   * @returns 
   */
  findMatch(userInput: string): string | undefined {
    let firstLetter = userInput.slice(0, 1);
    if (firstLetter === '#') {
      return this.handleChannelSearch(userInput);
    }
    if (firstLetter === '@') {
      return this.handleUserSearch(userInput)
    }
    return undefined;
  }

  handleChannelSearch(userInput: string): string | undefined {
    if (userInput.length === 1) {
      return this.storage.channel.length > 0 ? this.storage.channel[0].name : undefined;
    } else {
      let searchTerm = userInput.slice(1);
      return this.matchChannel(searchTerm);
    }
  }

  handleUserSearch(userInput: string): string | undefined {
    if (userInput.length === 1) {
      return this.storage.user.length > 0 ? this.storage.user[0].name : undefined;
    } else {
      let searchTerm = userInput.slice(1); 
      return this.matchUser(searchTerm);
    }
  }

  matchChannel(searchTerm: string): string | undefined {
    const channels: ChannelInterface[] = this.storage.channel;
    const match = channels.find(channel => 
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name;
  }

  matchUser(searchTerm: string): string | undefined {
    const users: UserInterface[] = this.storage.user;
    const match = users.find(user => 
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
      const prefix = this.userInput.charAt(0); // '#' oder '@'
      
      if ((prefix === '#' || prefix === '@') && this.userInput.length === 1) {
        // Nur '#' oder '@' eingegeben: Zeige den Vorschlag komplett an
        return `${prefix}${this.suggestion}`;
      } else if (prefix === '#' || prefix === '@') {
        // '#A' oder '@A' und Vorschlag 'Angular' oder 'Alice': Zeige '#Angular' oder '@Alice' an
        const searchTerm = this.userInput.slice(1); // Entferne '#' oder '@'
        const remaining = this.suggestion.slice(searchTerm.length);
        return `${this.userInput}${remaining}`;
      }
    }
    return this.userInput;
  }
  
  

  /**
     * Accepts the destination suggestion when the Enter or Tab key is pressed.
     * 
     * @param event 
     */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.suggestion ||
        event.key === 'Enter' && this.suggestion
    ) {
      this.handleSubmitSuggestion(event)
    }
  }

  // storage.setChannel(dm.id)

  handleSubmitSuggestion(event: KeyboardEvent) {
    event.preventDefault();
    this.acceptSuggestion();
    let firstLetter = this.userInput.slice(0, 1);
    if (firstLetter === '#') {
      
    }
    if (firstLetter === '@') {
      
    }
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


  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }


  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }
}