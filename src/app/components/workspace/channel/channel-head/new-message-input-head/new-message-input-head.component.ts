import { Component, inject, ViewChild, ElementRef, NgModule } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { CurrentUserInterface } from '../../../../../shared/interfaces/current-user-interface';
import { ChannelInterface } from '../../../../../shared/interfaces/channel.interface';

@Component({
  selector: 'app-new-message-input-head',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-message-input-head.component.html',
  styleUrl: './new-message-input-head.component.scss'
})
export class NewMessageInputHeadComponent {


  protected storage = inject(FirebaseStorageService);
  

  @ViewChild('inputField') inputField!: ElementRef;

  userInput: string = ''; // Binding to input value
  suggestion: string = ''; // save the current autocomplete

  selectedSuggestionIndex: number = -1;

  onInput(): void {
    this.updateSuggestion();
  }

  // new-message-input-head.component.ts

onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Tab' && this.suggestion) {
    event.preventDefault();
    this.acceptSuggestion();
  }

  if (event.key === 'Enter' && this.suggestion) {
    event.preventDefault();
    this.acceptSuggestion();
  }
}


  /**
   * Searches the suggestionsList for the first entry that begins with the userInput. If a match is found, suggestion is updated, otherwise it is emptied.
   */
  updateSuggestion(): void {
    if (this.userInput) {
      const match = this.findMatch(this.userInput);
      this.suggestion = match || '';
    } else {
      this.suggestion = '';
    }
  }


  findMatch(userInput: string): string | undefined {
    const firstLetter = userInput.slice(0, 1);
    
    if (firstLetter === '#') {
      if (userInput.length === 1) {
        return this.storage.channel.length > 0 ? this.storage.channel[0].name : undefined;
      } else {
        const searchTerm = userInput.slice(1); // Entferne das '#' für die Suche
        return this.matchChannel(searchTerm);
      }
    }
    
    // Andere Präfixe wie '@' oder E-Mail können hier hinzugefügt werden
    return undefined;
  }

  matchChannel(searchTerm: string): string | undefined {
    const channels: ChannelInterface[] = this.storage.channel;
    const match = channels.find(channel => 
      channel.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    return match?.name; // Gibt den Namen zurück oder undefined, wenn kein Treffer gefunden wurde
  }

  matchUser() {
    
  }

  matchMail() {
    
  }

  /**
 * Sets the userInput to the suggestion found and empties the suggestion.
 */
acceptSuggestion(): void {
  if (this.userInput.startsWith('#')) {
    this.userInput = `#${this.suggestion}`;
  } else {
    this.userInput = this.suggestion;
  }
  this.suggestion = '';
}

/**
 * A getter that assembles the displayed text in the suggestion div. 
 * It combines the userInput with the rest of the suggestion to display the suggestion.
 */
get displayText(): string {
  if (this.suggestion) {
    if (this.userInput.length === 1 && this.userInput.startsWith('#')) {
      // Nur '#' eingegeben: Zeige den Vorschlag komplett an
      return `#${this.suggestion}`;
    } else if (this.userInput.startsWith('#')) {
      // '#A' und suggestion 'Angular': Zeige '#Angular' an
      const searchTerm = this.userInput.slice(1); // Entferne '#'
      const remaining = this.suggestion.slice(searchTerm.length);
      return `${this.userInput}${remaining}`;
    }
  }
  return this.userInput;
}

  
  focusInput(): void {
    this.inputField.nativeElement.focus();
  }
  
  constructor() {}


  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }


  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }
}