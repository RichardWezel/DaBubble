import { Component, Input, inject,  OnChanges, SimpleChanges } from '@angular/core';
import { NgFor, NgIf, } from '@angular/common';
import { ChannelInterface } from '../../interfaces/channel.interface';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NavigationService } from '../../services/navigation.service';
import { SetMobileViewService, CurrentView } from '../../services/set-mobile-view.service';

type SearchResult = ChannelInterface | UserInterface;

@Component({
  selector: 'app-result-dropdown',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './result-dropdown.component.html',
  styleUrl: './result-dropdown.component.scss'
})
export class ResultDropdownComponent implements OnChanges{
  protected storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  searchResults: SearchResult[] = [];
  @Input() userInput: string = "";
  public isLargeScreen: boolean = window.innerWidth >= 1201;

  constructor(private viewService: SetMobileViewService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userInput']) {
      const neuesWert = changes['userInput'].currentValue;
      if (neuesWert.length >= 1) {
        this.updateFoundedChannelsAndUsers(neuesWert);
      } else {
        this.searchResults = [];
      }
    }
  }

  /**
   * Aktualisiert die Suchergebnisse basierend auf dem Präfix des Benutzereingabe.
   * @param input - Der gesamte Benutzereingabe-String.
   */
  updateFoundedChannelsAndUsers(input: string): void {
    if (input.startsWith('#')) {
      const searchTerm = input.substring(1);
      this.searchResults = this.findChannels(searchTerm);
    } else if (input.startsWith('@')) {
      const searchTerm = input.substring(1);
      this.searchResults = this.findUsers(searchTerm);
      console.log(this.searchResults);
    } else {
      this.searchResults = [];
    }
  }

  /**
   * Sucht nach Channels, die den Suchbegriff enthalten.
   * @param searchTerm - Der Suchbegriff ohne Präfix.
   * @returns Ein Array von ChannelInterface Objekten.
   */
  findChannels(searchTerm: string): ChannelInterface[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Sucht nach Users, die den Suchbegriff enthalten.
   * @param searchTerm - Der Suchbegriff ohne Präfix.
   * @returns Ein Array von UserInterface Objekten.
   */
  findUsers(searchTerm: string): UserInterface[] {
    const users: UserInterface[] = this.storage.user;
    return users.filter(user =>
      user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  isChannel() {
    return this.userInput.startsWith('#');
  }

  isUser() {
    return this.userInput.startsWith('@');
  }

  /**
   * Handles the selection of a channel by setting the current channel in the navigation service,
   * and potentially changing the view based on the screen size.
   * 
   * @param {string} channelId - The ID of the channel to navigate to.
   */
  handleClick(channelId: string) {
    if (this.userInput.startsWith('#')) {
      this.navigationService.setChannel(channelId)
      if (!this.isLargeScreen) {
        this.setView('channel')
      }
    } else if (this.userInput.startsWith('@')) {
      console.log(channelId);
      this.navigationService.setChannel(channelId)
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
    }
   
  }

   /**
   * Sets the current view for the application based on the provided view type,
   * aiding in responsive layout management.
   * 
   * @param {CurrentView} view - The view to set (e.g., 'workspaceMenu', 'channel', 'thread').
   */
   setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
