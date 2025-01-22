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
  handleClick(result: SearchResult) {
    let typ = result.type;
    if (typ === 'channel') {
      this.navigationService.setChannel(result?.id!)
      if (!this.isLargeScreen) {
        this.setView('channel')
      }
    } else if (typ === 'user') {
      this.setTypeUser(result);
    }
  }

  /**
   * Handles navigation when a user is selected from the search results.
   * Initiates or navigates to a direct message channel with the user.
   * @param result - The selected SearchResultUser object.
   */
  async setTypeUser(result: SearchResult): Promise<void> {
    let dmId = await this.findIdOfDM(result as UserInterface);
    if (dmId) {
      this.navigationService.setChannel(dmId);
      this.viewService.setCurrentView('channel');
    } else if (result.id === this.storage.currentUser.id) {
      this.navigationService.setChannel('');
      this.viewService.setCurrentView('channel');
    } else {
      console.error('DM id ist undefiniert.');
      return;
    }
  }

  /**
   * Finds the ID of the direct message (DM) channel for a given user.
   * Creates a new DM channel if one does not already exist.
   * @param result - The UserInterface object representing the selected user.
   * @returns A promise that resolves to the DM channel ID or undefined.
   */
  async findIdOfDM(result: UserInterface): Promise<string | undefined> {
    const UserMatch = this.storage.user.find(user => 
      user.name.toLowerCase().includes(result.name.toLowerCase())
    );
    if (UserMatch && this.findUserInDms(UserMatch)) {
      return this.getDmContact(UserMatch?.id!);
    } else if (UserMatch && !this.findUserInDms(UserMatch)) {
      return await this.showNewDm(UserMatch);
    } else {
      return this.storage.currentUser.currentChannel;
    }
  }

  /**
   * Checks if a user is already in the current user's direct messages.
   * @param UserMatch - The UserInterface object to check.
   * @returns True if the user is in DMs, false otherwise.
   */
  findUserInDms(UserMatch: UserInterface): boolean {
    return this.storage.currentUser.dm.some(dm => dm.contact === UserMatch.id);
  }

  /**
   * Retrieves the DM channel ID for a given user ID.
   * @param IdOfUser - The ID of the user.
   * @returns The DM channel ID or undefined if not found.
   */
  getDmContact(IdOfUser: string): string | undefined {
    const dm = this.storage.currentUser.dm.find(dm => dm.contact === IdOfUser);
    return dm ? dm.id : undefined;
  }

  /**
   * Creates a new direct message channel with the specified user.
   * @param UserMatch - The UserInterface object representing the user to message.
   * @returns A promise that resolves to the new DM channel ID or undefined.
   */
  async showNewDm(UserMatch: UserInterface): Promise<string | undefined> {
    await this.createEmptyDms(UserMatch);
    let dmWithNewUser = this.storage.currentUser.dm.find(dm => dm.contact === UserMatch.id);
    if (dmWithNewUser) {
      return dmWithNewUser!.id;
    } else {
      return this.storage.currentUser.currentChannel;
    }
  }

  /**
   * Creates empty DM channels between the current user and the specified user.
   * @param match - The UserInterface object representing the user to message.
   */
  async createEmptyDms(match: UserInterface): Promise<void> {
    let currentUserId = this.storage.currentUser.id;
    let NewUserId = match.id;
    if (currentUserId && NewUserId) {
      await this.storage.createNewEmptyDm(currentUserId, NewUserId);
      await this.storage.createNewEmptyDm(NewUserId, currentUserId);
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
