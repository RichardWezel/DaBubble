import { NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { ChannelInterface } from '../../../../shared/interfaces/channel.interface';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { UserInterface } from '../../../../shared/interfaces/user.interface';
import { SearchResult, SearchResultChannel, SearchResultChannelPost, SearchResultUser } from '../../../../shared/interfaces/search-result.interface';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  protected storage = inject(FirebaseStorageService);
  navigation = inject(NavigationService);
  searchResults: SearchResult[] = [];
  userInput: string = "";
  selectedIndex: number = -1;
  
  constructor(
    private sanitizer: DomSanitizer
  ) {}

  @ViewChildren('resultItem') resultItems!: QueryList<ElementRef>;

  onInput(): void {
    this.searchResults = [];
    this.updateSearchResults();
    this.selectedIndex = -1;
  }

  updateSearchResults() {
    if (this.userInput.length >= 2) {
      this.updateFoundedChannelsAndUsers();
    } else {
      this.searchResults = [];
      this.selectedIndex = -1;
    }
  }

  updateFoundedChannelsAndUsers() {
    if (this.userInput) {
      const channelMatches: SearchResultChannel[] = this.findChannels(this.userInput);
      const userMatches: SearchResultUser[] = this.findUser(this.userInput);
      const channelPostMatches: SearchResultChannelPost[] = this.findChannelsByPost(this.userInput);
      this.searchResults = [...channelMatches, ...userMatches, ...channelPostMatches];
    } else {
      this.searchResults = [];
      this.selectedIndex = -1;
    }
  }

  findChannels(userInput: string): SearchResultChannel[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    const matches = channels.filter(channel =>
      channel.name.toLowerCase().includes(userInput.toLowerCase())
    ).map(channel => ({ type: 'channel', channel } as SearchResultChannel));
    return matches;
  }

  findUser(userInput: string): SearchResultUser[] {
    const users: UserInterface[] = this.storage.user;
    const matches = users.filter(user =>
      user.name.toLowerCase().includes(userInput.toLowerCase())
    ).map(user => ({ type: 'user', user } as SearchResultUser));
    return matches;
  }

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
            });
          }
        });
      }
    });
  
    return matches;
  }

  // search.component.ts

async setChannel(result: SearchResult): Promise<void> {
  if (result.type === 'channel') {
    const channel = result.channel;
    if (channel.id) {
      this.navigation.setChannel(channel.id);
    } else {
      console.error('Channel id is undefined.');
      return;
    }
  }
  
  if (result.type === 'user') {
    const user = result.user;
    let dmId = await this.findIdOfDM(user);
    if (dmId) {
      this.navigation.setChannel(dmId);
    } else {
      console.error('DM id is undefined.');
      return;
    }
  }

  if (result.type === 'channel-post') {
    const channel = result.channel;
    const post = result.post;
    if (channel.id) {
      this.navigation.setChannel(channel.id);
      // Optional: Navigieren Sie zu dem spezifischen Post, falls Ihr Navigationssystem dies unterstützt
      // Beispielsweise:
      // this.navigation.navigateToPost(channel.id, post.id);
    } else {
      console.error('Channel id is undefined.');
      return;
    }
  }
  
  this.userInput = "";
  this.searchResults = [];
  this.selectedIndex = -1;
}

  

  async findIdOfDM(result: UserInterface): Promise<string | undefined> {
    const UserMatch = this.storage.user.find(user => 
      user.name.toLowerCase().startsWith(result.name.toLowerCase()));
    if (UserMatch && this.findUserInDms(UserMatch)) {
      return this.getDmContact(UserMatch?.id!);
    } else if (UserMatch && !this.findUserInDms(UserMatch)) {
      return await this.showNewDm(UserMatch);
    } else {
      return this.storage.currentUser.currentChannel;
    }
  }
  

  findUserInDms(UserMatch: UserInterface): boolean {
    return this.storage.currentUser.dm.some(dm => dm.contact === UserMatch.id);
  }

  getDmContact(IdOfUser: string): string | undefined {
    const dm = this.storage.currentUser.dm.find(dm => dm.contact === IdOfUser);
    return dm ? dm.id : undefined;
  }

  async showNewDm(UserMatch: UserInterface) {
    await this.createEmptyDms(UserMatch);
    let dmWithNewUser = this.storage.currentUser.dm.find(dm => dm.contact === UserMatch.id);
    if (dmWithNewUser) {
      return dmWithNewUser!.id
    } else {
      return this.storage.currentUser.currentChannel
    };
  }

  async createEmptyDms(match: UserInterface) {
    let currentUserId = this.storage.currentUser.id;
    let NewUserId = match.id;
    if (currentUserId && NewUserId) {
      await this.storage.createNewEmptyDm(currentUserId, NewUserId);
      await this.storage.createNewEmptyDm(NewUserId, currentUserId);
    }
  }

  async handleKeyboardEvent(event: KeyboardEvent): Promise<void> {
    if (this.searchResults.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); 
        this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        this.scrollToSelected();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedIndex = (this.selectedIndex > 0 ? this.selectedIndex - 1 : this.searchResults.length - 1);
        this.scrollToSelected();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
          try {
            await this.setChannel(this.searchResults[this.selectedIndex]);
          } catch (error) {
            console.error('Error setting channel:', error);
          }
        }
      }
    }
  }
  
  
  scrollToSelected() {
    const listItems = document.querySelectorAll('.result-container ul li');
    if (this.selectedIndex >= 0 && this.selectedIndex < listItems.length) {
      const selectedItem = listItems[this.selectedIndex] as HTMLElement;
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Typ-Guard für ChannelInterface
  isChannel(result: ChannelInterface | UserInterface): result is ChannelInterface {
    const isChan = result.type === 'channel';
    return isChan;
  }

  // Typ-Guard für UserInterface
  isUser(result: ChannelInterface | UserInterface): result is UserInterface {
    const isUsr = result.type === 'user';
    return isUsr;
  }

  /**
   * Opens or closes the thread of the given post ID.
   * If the thread is currently open, it will be closed, and vice versa.
   * The post ID is stored in the currentUser object in the storage.
   * @param {string} postId - The ID of the post to open or close the thread of.
   */
  openThread(postId: string) {
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
  }

  /**
   * Hebt den Suchbegriff im Text hervor.
   * @param {string} text - Der Text, in dem der Suchbegriff hervorgehoben werden soll.
   * @returns {SafeHtml} - Der hervorgehobene Text als sicherer HTML-Inhalt.
   */
  highlightMatch(text: string): SafeHtml {
    if (!this.userInput) return text;
    const regex = new RegExp(`(${this.escapeRegExp(this.userInput)})`, 'gi');
    const highlighted = text.replace(regex, '<span class="test">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  /**
   * Escaped spezielle Zeichen in einem regulären Ausdruck.
   * @param {string} text - Der Text, der escaped werden soll.
   * @returns {string} - Der escapete Text.
   */
  private escapeRegExp(text: string): string {
    return text.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
  }

}
