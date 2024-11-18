import { Component, inject, ViewChild, ElementRef, NgModule } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NgStyle } from '@angular/common';

import { FormsModule } from '@angular/forms'; // Importiere FormsModule

@Component({
  selector: 'app-channel-head',
  standalone: true,
  imports: [NgStyle,
    FormsModule],
  templateUrl: './channel-head.component.html',
  styleUrl: './channel-head.component.scss'
})
export class ChannelHeadComponent {
  protected storage = inject(FirebaseStorageService);
  imgTag: string = 'assets/icons/tag.svg';
  imgCaret: string = 'assets/icons/user-caret.svg';
  newMessage: boolean = false;

  @ViewChild('inputField') inputField!: ElementRef;

  userInput: string = '';
  suggestion: string = '';

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

  updateSuggestion(): void {
    if (this.userInput) {
      const match = this.suggestionsList.find(item =>
        item.toLowerCase().startsWith(this.userInput.toLowerCase())
      );
      if (match) {
        this.suggestion = match;
      } else {
        this.suggestion = '';
      }
    } else {
      this.suggestion = '';
    }
  }

  acceptSuggestion(): void {
    this.userInput = this.suggestion;
    this.suggestion = '';
  }

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

  /**
   * Gleicht ab, ob ein Channel oder eine DM als ID in currentChannel des currentUsers enthalten ist 
   * und gibt je nach Ergebnis 'channel' || 'dm' || '' zurück.
   *
   * @returns {string} 
   */
  findChannel(): "channel" | "dm" | "newMessage" | "" {
    // findet den ersten Channel, deren id mit der currentChannel des currentUser übereinstimmt.
    let foundChannel = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
    let foundDM = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel);
    if (foundChannel) {
      this.storage.currentUser.currentChannelName = '#' + foundChannel.name;
      return 'channel';
    } else if (foundDM) {
      this.storage.currentUser.currentChannelName = this.storage.user.find(user => user.id === foundDM?.contact)?.name;
      return 'dm';
    } else if (sessionStorage.getItem('currentChannel') == "newMessage") {
      return 'newMessage';
    }
    else 
    console.log('currentUser.currentChannelName is set to `` ')
    return '';
  }

  channelName() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name;
  }


  channelUser() {
    let users = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
    if (users) return users;
    else return [];
  }


  findAvatar(user: string) {
    return this.storage.user.find(u => u.id === user)?.avatar;
  }


  userAvatar() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    return this.storage.user.find(user => user.id === foundUser)?.avatar;
  }


  userName() {
    let foundUser = this.storage.currentUser.dm.find((dm: { contact: string, id: string, posts: any[] }) => dm.id === this.storage.currentUser.currentChannel)?.contact;
    return this.storage.user.find(user => user.id === foundUser)?.name;
  }

  checkInput(value: string): void {
    let firstLetter = value.slice(0,1);
   
     if (firstLetter == '#') {
      this.autocompleteChannel();
     } else if (firstLetter == '@') {
      this.autocompleteUser()
     } else {
      this.autocompleteMail()
     }
  }

  autocompleteChannel() {
    console.log('autocomplete Channel')
  }

  autocompleteUser() {
    console.log('autocomplete User')
  }

  autocompleteMail() {
    console.log('autocomplete Mail')
  }
}