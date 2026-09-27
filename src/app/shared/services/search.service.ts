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
  private viewService = inject(SetMobileViewService);

  constructor() { }


  /**
   * Id of the conversation with the given user, created on first contact.
   * @param result - the user to talk to
   */
  async findIdOfDM(result: UserInterface): Promise<string | undefined> {
    const match = this.storage.user.find(user =>
      user.name.toLowerCase().includes(result.name.toLowerCase())
    );
    const currentUserId = this.storage.currentUser.id;
    if (!match?.id || !currentUserId) return this.storage.currentUser.currentChannel;
    return await this.storage.ensureDm(currentUserId, match.id);
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
   * Searches the messages of every channel the user is in. Backed by the
   * storage service's search index, which is fetched once and reused - the
   * messages are no longer all in memory, and Firestore cannot match
   * substrings server-side.
   * @param userInput - The search term entered by the user.
   * @returns The matching messages with the channel they belong to.
   */
  async findChannelsByPost(userInput: string): Promise<SearchResultChannelPost[]> {
    const inputLower = userInput.toLowerCase();
    const { channelPosts } = await this.storage.loadSearchIndex();
    return channelPosts
      .filter(({ post }) => post.text.toLowerCase().includes(inputLower))
      .map(({ post, channel }) => ({ type: 'channel-post', channel, post } as SearchResultChannelPost));
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
