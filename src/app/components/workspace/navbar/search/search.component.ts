import { NgFor, NgIf, NgSwitch, NgSwitchCase, CommonModule } from '@angular/common';
import { Component, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { ChannelInterface } from '../../../../shared/interfaces/channel.interface';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { UserInterface } from '../../../../shared/interfaces/user.interface';
import { SearchResult, SearchResultChannel, SearchResultChannelPost, SearchResultUser, SearchResultThread } from '../../../../shared/interfaces/search-result.interface';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SetMobileViewService } from '../../../../shared/services/set-mobile-view.service';
import { GetUserNameService } from '../../../../shared/services/get-user-name.service';
import { ResultDropdownComponent } from '../../../../shared/components/result-dropdown/result-dropdown.component';
import { SearchService } from '../../../../shared/services/search.service';
/**
 * SearchComponent handles the search functionality within the application,
 * including searching for channels, users, posts, and threads, and navigating to selected results.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgSwitch, NgSwitchCase, CommonModule, ResultDropdownComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  protected storage = inject(FirebaseStorageService);
  navigation = inject(NavigationService);
  getUserName = inject(GetUserNameService);
  search = inject(SearchService);
  searchResults: SearchResult[] = [];
  userInput: string = "";
  selectedIndex: number = -1;
  dropDownIsOpen: boolean = false;

  private searchSubject = new Subject<string>();

  @ViewChildren('resultItem') resultItems!: QueryList<ElementRef>;
  
  /**
   * Creates an instance of SearchComponent and sets up the search debouncing.
   * @param sanitizer - The DomSanitizer service to safely bind HTML content.
   */
  constructor(
    private sanitizer: DomSanitizer,
    private viewService: SetMobileViewService
  ) {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(searchTerm => {
      this.userInput = searchTerm;
      this.onInputSearch();
    });
  }
 
  /**
   * Handles the input event from the search bar by emitting the current user input.
   */
  onInput(): void {
    if (this.userInput.startsWith('@') || this.userInput.startsWith('#')) {
      this.showDropdown();
    } else {
      this.searchSubject.next(this.userInput);
      this.selectedIndex = -1;
    }
  }

  showDropdown() {
    this.dropDownIsOpen = true;
  }

  /**
   * Initiates the search process by resetting search results and updating them based on user input.
   */
  onInputSearch(): void {
    this.searchResults = [];
    this.updateSearchResults();
    this.selectedIndex = -1;
  }

  /**
   * Updates the search results based on the current user input.
   * Searches for channels, users, channel posts, and threads if the input length is sufficient.
   */
  updateSearchResults(): void  {
    if (this.userInput.length >= 2) {
      this.updateFoundedChannelsAndUsers();
      this.updateFoundedThreads();
    } else {
      this.searchResults = [];
      this.selectedIndex = -1;
    }
  }

  /**
   * Aggregates search results by finding matching channels, users, and channel posts.
   */
  updateFoundedChannelsAndUsers(): void  {
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


  /**
   * Aggregates search results by finding matching threads.
   */
  updateFoundedThreads(): void {
    const threads = this.storage.getAllThreads();
    const threadMatches: SearchResultThread[] = threads.filter(({ thread }) => 
      thread.text.toLowerCase().includes(this.userInput.toLowerCase())
    ).map(({ thread, parent }) => ({
      type: 'thread',
      parentType: parent.type === 'channel' ? 'channel' : 'user',
      parentId: parent.id || '',
      thread
    }) as SearchResultThread);
    
    this.searchResults = [...this.searchResults, ...threadMatches];
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
   * Sets the channel, user, channel post, or thread based on the selected search result.
   * Navigates to the appropriate channel or direct message and opens the thread if applicable.
   * @param result - The selected SearchResult object.
   */
  async setChannel(result: SearchResult): Promise<void> {
    this.setTypeChannel(result);
    this.setTypeUser(result);
    this.setTypeChannelPost(result);
    this.setTypeThread(result);

    this.userInput = "";
    this.searchResults = [];
    this.selectedIndex = -1;
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
      let dmId = await this.search.findIdOfDM(user);
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
   * Handles navigation when a thread is selected from the search results.
   * Navigates to the specific channel or DM and opens the associated thread.
   * @param result - The selected SearchResultThread object.
   */
  async setTypeThread(result: SearchResult): Promise<void> {
    if (result.type === 'thread') {
      const threadResult = result as SearchResultThread;
      console.log('setTypeThread in search.c: ', threadResult)
      if (threadResult.parentId) {
        this.navigation.setChannel(threadResult.parentId);
        let postId = this.storage.findParentPostId(threadResult.parentId, threadResult.thread.id)
        this.openThread(postId!);
        console.log('postId: ',this.storage.currentUser.postId);
        this.viewService.setCurrentView('thread');
      } else {
        console.error('Parent ID des Threads ist undefiniert.');
        return;
      }
    }
  }


  /**
   * Handles keyboard events for navigating through search results.
   * Supports ArrowUp, ArrowDown, and Enter keys.
   * @param event - The KeyboardEvent object.
   */
  async handleKeyboardEvent(event: KeyboardEvent): Promise<void> {
    if (this.searchResults.length > 0) {
      if (event.key === 'ArrowDown') {
        this.handleArrowDown(event)
      } else if (event.key === 'ArrowUp') {
        this.handleArrowUp(event)
      } else if (event.key === 'Enter') {
        await this.handleEnter(event)
      }
    }
  }


  /**
   * Handles the ArrowDown key press to move the selection down in the search results.
   * @param event - The KeyboardEvent object.
   */
  handleArrowDown(event: KeyboardEvent): void {
    event.preventDefault(); 
    this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
    this.scrollToSelected();
  }


  /**
   * Handles the ArrowUp key press to move the selection up in the search results.
   * @param event - The KeyboardEvent object.
   */
  handleArrowUp(event: KeyboardEvent): void {
    event.preventDefault();
    this.selectedIndex = (this.selectedIndex > 0 ? this.selectedIndex - 1 : this.searchResults.length - 1);
    this.scrollToSelected();
  }


  /**
   * Handles the Enter key press to select the currently highlighted search result.
   * @param event - The KeyboardEvent object.
   */
  async handleEnter(event: KeyboardEvent): Promise<void> {
    event.preventDefault();
    if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
      try {
        await this.setChannel(this.searchResults[this.selectedIndex]);
      } catch (error) {
        console.error('Error setting channel:', error);
      }
    }
  }
  

  /**
   * Scrolls the view to the currently selected search result.
   */
  scrollToSelected(): void {
    const listItems = document.querySelectorAll('.result-container ul li');
    if (this.selectedIndex >= 0 && this.selectedIndex < listItems.length) {
      const selectedItem = listItems[this.selectedIndex] as HTMLElement;
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }


  /**
   * Type guard to determine if a SearchResult is a ChannelInterface.
   * @param result - The SearchResult object to check.
   * @returns True if the result is a SearchResultChannel, false otherwise.
   */
  isChannel(result: ChannelInterface | UserInterface): result is ChannelInterface {
    const isChan = result.type === 'channel';
    return isChan;
  }


  /**
   * Type guard to determine if a SearchResult is a UserInterface.
   * @param result - The SearchResult object to check.
   * @returns True if the result is a SearchResultUser, false otherwise.
   */
  isUser(result: ChannelInterface | UserInterface): result is UserInterface {
    const isUsr = result.type === 'user';
    return isUsr;
  }


  /**
   * Opens or closes the thread of the given post ID.
   * If the thread is currently open, it will be closed, and vice versa.
   * The post ID is stored in the currentUser object in the storage.
   * @param postId - The ID of the post to open or close the thread of.
   */
  openThread(postId: string): void {
    console.log('openThread() in search.c: ', postId);
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
    // Optional: Emit an event or trigger UI update if necessary
  }


  /**
   * Highlights the search term within the given text by wrapping it in a span with the "highlight" class.
   * @param text - The text in which the search term should be highlighted.
   * @returns The highlighted text as SafeHtml.
   */
  highlightMatch(text: string | undefined): SafeHtml {
    if (!text) return ''; // Fallback für undefined
    if (!this.userInput) return text;
    const regex = new RegExp(`(${this.escapeRegExp(this.userInput)})`, 'gi');
    const highlighted = text.replace(regex, '<span class="highlight" style="color: #797EF3; font-weight: 100;">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }


  /**
   * Escapes special characters in a string to safely use it within a regular expression.
   * @param text - The text to escape.
   * @returns The escaped text.
   */
  private escapeRegExp(text: string): string {
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
