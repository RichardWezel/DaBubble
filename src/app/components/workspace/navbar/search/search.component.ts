import { NgFor, NgIf, NgSwitch, NgSwitchCase, CommonModule } from '@angular/common';
import { Component, inject, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
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
import { OpenCloseDialogService } from '../../../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

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
  elementRef = inject(ElementRef);
  openCloseService = inject(OpenCloseDialogService);
  private viewService = inject(SetMobileViewService);
  userInput: string = '';
  searchResults: SearchResult[] = [];
  selectedIndex: number = 0;
  dropDownIsOpen: boolean = false;
  dropdownElement: HTMLElement | undefined;
  placeholderText: string = 'Standard Placeholder';

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription = new Subscription();

  @ViewChildren('resultItem') resultItems!: QueryList<ElementRef>;


  /**
   * Creates an instance of SearchComponent and sets up the search debouncing.
   * @param sanitizer - The DomSanitizer service to safely bind HTML content.
   */
  constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(searchTerm => {
      this.userInput = searchTerm;
      this.onInputSearch();
    });
  }


  @HostListener('window:resize', ['$event'])
  /**
   * Listens for the window resize event and updates the placeholder text accordingly.
   * This is necessary because the placeholder text changes depending on the screen size.
   * @param event The window resize event.
   */
  onResize(event: any) {
    this.setPlaceholder(event.target.innerWidth);
  }


  /**
   * Sets the placeholder depending on the screen size.
   * 
   * @param width - innerWidth of target.
   */
  setPlaceholder(width: number) {
    if (width <= 333) {
      this.placeholderText = 'durchsuchen';
    } else {
      this.placeholderText = 'Devspace durchsuchen';
    }
  }


  /**
   * Subscribes to the open/close status of the dialog, setting visibility based on the status.
   */
  ngOnInit(): void {
    const sub = this.openCloseService
      .isDialogOpen('resultDropdown')
      ?.subscribe((status) => {
        this.dropDownIsOpen = status;
      });
    if (sub) this.subscriptions.add(sub);
    this.setPlaceholder(window.innerWidth);
  }


  /**
   * Unsubscribes from all active subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Handles the input event from the search bar by emitting the current user input.
   */
  onInput(): void {
    if (this.userInput.startsWith('@') || this.userInput.startsWith('#')) {
      this.openDialog();
    } else {
      this.searchSubject.next(this.userInput);
      this.selectedIndex = -1;
      this.closeDialog();
    }
  }


  /**
   * Opens the dialog for adding a new channel.
   */
  public openDialog() {
    this.dropDownIsOpen = true;
  }


  /**
   * Closes the dialog for adding a new channel.
   */
  public closeDialog() {
    this.dropDownIsOpen = false;
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
  updateSearchResults(): void {
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
  updateFoundedChannelsAndUsers(): void {
    if (this.userInput) {
      const channelMatches: SearchResultChannel[] = this.search.findChannels(this.userInput);
      const userMatches: SearchResultUser[] = this.search.findUser(this.userInput);
      const channelPostMatches: SearchResultChannelPost[] = this.search.findChannelsByPost(this.userInput);
      this.searchResults = [...channelMatches, ...userMatches, ...channelPostMatches];

      if (this.searchResults.length === 0) {
        this.openCloseService.close('resultDropdown');
        this.cd.detectChanges();
      }
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
   * Sets the channel, user, channel post, or thread based on the selected search result.
   * Navigates to the appropriate channel or direct message and opens the thread if applicable.
   * @param result - The selected SearchResult object.
   */
  async setChannel(result: SearchResult): Promise<void> {
    this.search.setTypeChannel(result);
    this.search.setTypeUser(result);
    this.search.setTypeChannelPost(result);
    this.setTypeThread(result);
    this.userInput = "";
    this.searchResults = [];
    this.selectedIndex = -1;
  }


  /**
   * Handles navigation when a thread is selected from the search results.
   * Navigates to the specific channel or DM and opens the associated thread.
   * @param result - The selected SearchResultThread object.
   */
  async setTypeThread(result: SearchResult): Promise<void> {
    if (result.type === 'thread') {
      const threadResult = result as SearchResultThread;
      if (threadResult.parentId) {
        this.navigation.setChannel(threadResult.parentId);
        let postId = this.storage.findParentPostId(threadResult.parentId, threadResult.thread.id)
        this.openThread(postId!);
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
    if (this.searchResults.length > 0 || this.dropDownIsOpen) {
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
    if (this.dropDownIsOpen) {
      this.dropdownElement = this.elementRef.nativeElement.querySelector('#result-dropdown');
      this.dropdownElement!.focus();
    } else {
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      this.scrollToSelected();
    }
  }


  /**
   * Handles the ArrowUp key press to move the selection up in the search results.
   * @param event - The KeyboardEvent object.
   */
  handleArrowUp(event: KeyboardEvent): void {
    event.preventDefault();
    if (this.dropDownIsOpen) {
      this.dropdownElement = this.elementRef.nativeElement.querySelector('#result-dropdown');
      this.dropdownElement!.focus();
    } else {
      this.selectedIndex = (this.selectedIndex > 0 ? this.selectedIndex - 1 : this.searchResults.length - 1);
      this.scrollToSelected();
    }
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
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
  }


  /**
   * Highlights the search term within the given text by wrapping it in a span with the "highlight" class.
   * @param text - The text in which the search term should be highlighted.
   * @returns The highlighted text as SafeHtml.
   */
  highlightMatch(text: string | undefined): SafeHtml {
    if (!text) return ''; // Fallback für undefined
    if (!this.userInput) return text;
    const regex = new RegExp(`(${this.search.escapeRegExp(this.userInput)})`, 'gi');
    const highlighted = text.replace(regex, '<span class="highlight" style="color: #797EF3; font-weight: 100;">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
