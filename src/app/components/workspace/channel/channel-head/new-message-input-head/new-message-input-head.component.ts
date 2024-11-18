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

  // Beispielhafte Liste von Suchvorschlägen
  suggestionsList: string[] = [
    'Angular',
    'Angular Material',
    'Angular CLI',
    'Angular Universal',
    'Angular Forms',
    'Angular Router'
  ];

  onInput(): void {
    this.updateSuggestion();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.suggestion) {
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
    let firstLetter = userInput.slice(0,1);
    if (firstLetter == '#') {
     return this.matchChannel(userInput);
    } else {
      return ''
    }
  }

  matchChannel(userInput: string): string | undefined {
    const channels: ChannelInterface[] = this.storage.channel;
    const match = channels.find(channel => channel.name === userInput);
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
    this.userInput = this.suggestion;
    this.suggestion = '';
  }

  /**
   * A getter that assembles the displayed text in the suggestion div. It combines the userInput with the rest of the suggestion to display the suggestion.
   */
  get displayText(): string {
    if (this.suggestion) {
      return this.userInput + this.suggestion.slice(this.userInput.length);
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