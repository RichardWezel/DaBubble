import { Injectable, inject } from '@angular/core';
import { UserInterface } from '../interfaces/user.interface';
import { FirebaseStorageService } from './firebase-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchResultChannel, SearchResultUser, SearchResultChannelPost, SearchResult } from '../interfaces/search-result.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { NavigationService } from './navigation.service';
import { SetMobileViewService } from './set-mobile-view.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  protected storage = inject(FirebaseStorageService);
  navigation = inject(NavigationService);

  private userInputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public userInput$: Observable<string> = this.userInputSubject.asObservable();
  private viewService = inject(SetMobileViewService);
  constructor() { }

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
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    return curUser!.dm.some(dm => dm.contact === UserMatch.id);
  }

  /**
   * Retrieves the DM channel ID for a given user ID.
   * @param IdOfUser - The ID of the user.
   * @returns The DM channel ID or undefined if not found.
   */
  getDmContact(IdOfUser: string): string | undefined {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    const dm = curUser?.dm.find(dm => dm.contact === IdOfUser);
    return dm ? dm.id : undefined;
  }

  /**
   * Creates a new direct message channel with the specified user.
   * @param UserMatch - The UserInterface object representing the user to message.
   * @returns A promise that resolves to the new DM channel ID or undefined.
   */
  async showNewDm(UserMatch: UserInterface): Promise<string | undefined> {
    await this.createEmptyDms(UserMatch);
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let dmWithNewUser = curUser?.dm.find(dm => dm.contact === UserMatch.id);
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
   * Sets the current user input and notifies all subscribers.
   * @param input - The new user input.
   */
  setUserInput(input: string): void {
    this.userInputSubject.next(input);
  }
  
  /**
   * Returns the current value of the user input.
   * @returns The current user input.
   */
  getUserInput(): string {
    return this.userInputSubject.value;
  }


  /**
   * Searches for channels that include the user input in their names.
   * @param userInput - The search term entered by the user.
   * @returns An array of SearchResultChannel objects matching the search term.
   */
  findChannels(userInput: string): SearchResultChannel[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    const matches = channels.filter(channel =>
      channel.name.toLowerCase().includes(userInput.toLowerCase())
    ).map(channel => ({ type: 'channel', channel } as SearchResultChannel));
    return matches;
  }


  /**
   * Searches for users that include the user input in their names.
   * @param userInput - The search term entered by the user.
   * @returns An array of SearchResultUser objects matching the search term.
   */
  findUser(userInput: string): SearchResultUser[] {
    const users: UserInterface[] = this.storage.user;
    const lowerInput = userInput.toLowerCase();
    const matches = users.filter(user =>
      user.name && user.name.toLowerCase().includes(lowerInput)
    ).map(user => ({ type: 'user', user } as SearchResultUser));
    return matches;
  }


  /**
   * Searches for channel posts that include the user input in their text.
   * @param userInput - The search term entered by the user.
   * @returns An array of SearchResultChannelPost objects matching the search term.
   */
  findChannelsByPost(userInput: string): SearchResultChannelPost[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    const inputLower = userInput.toLowerCase();
    const matches: SearchResultChannelPost[] = [];

    channels.forEach(channel => {
      if (channel.posts) {
        channel.posts.forEach(post => {
          if (post.text.toLowerCase().includes(inputLower)) {
            matches.push({
              type: 'channel-post',
              channel,
              post
            } as SearchResultChannelPost);
          }
        });
      }
    });

    return matches;
  }


  /**
   * Handles navigation when a channel is selected from the search results.
   * @param result - The selected SearchResultChannel object.
   */
  setTypeChannel(result: SearchResult): void {
    if (result.type === 'channel') {
      const channel = result.channel;
      if (channel.id) {
        this.navigation.setChannel(channel.id);
        this.viewService.setCurrentView('channel');
      } else {
        console.error('Channel id ist undefiniert.');
        return;
      }
    }
  }


  /**
   * Handles navigation when a user is selected from the search results.
   * Initiates or navigates to a direct message channel with the user.
   * @param result - The selected SearchResultUser object.
   */
  async setTypeUser(result: SearchResult): Promise<void> {
    if (result.type === 'user') {
      const user = result.user;
      let dmId = await this.findIdOfDM(user);
      if (dmId) {
        this.navigation.setChannel(dmId);
        this.viewService.setCurrentView('channel');
      } else if (user.id === this.storage.currentUser.id) {
        this.navigation.setChannel('');
        this.viewService.setCurrentView('channel');
      } else {
        console.error('DM id ist undefiniert.');
        return;
      }
    }
  }


  /**
   * Handles navigation when a channel post is selected from the search results.
   * Navigates to the specific channel and optionally to the specific post.
   * @param result - The selected SearchResultChannelPost object.
   */
  setTypeChannelPost(result: SearchResult): void {
    if (result.type === 'channel-post') {
      const channel = result.channel;
      const post = result.post;
      if (channel.id) {
        this.navigation.setChannel(channel.id);
        this.viewService.setCurrentView('channel');
      } else {
        console.error('Channel id ist undefiniert.');
        return;
      }
    }
  }


  /**
   * Escapes special characters in a string to safely use it within a regular expression.
   * @param text - The text to escape.
   * @returns The escaped text.
   */
  escapeRegExp(text: string): string {
    return text.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
  }


  /**
   * Retrieves the channel name based on the channel ID.
   * @param channelId - The ID of the channel.
   * @returns The name of the channel or an empty string if not found.
   */
  getChannelName(channelId: string): string {
    const channel = this.storage.channel.find(ch => ch.id === channelId);
    return channel ? channel.name : '';
  }

}
