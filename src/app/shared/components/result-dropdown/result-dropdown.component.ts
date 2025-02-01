import { Component, Input, inject, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NgFor, NgIf, } from '@angular/common';
import { ChannelInterface } from '../../interfaces/channel.interface';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NavigationService } from '../../services/navigation.service';
import { SetMobileViewService, CurrentView } from '../../services/set-mobile-view.service';
import { SearchService } from '../../services/search.service';
import { OpenCloseDialogService } from '../../services/open-close-dialog.service';

type SearchResult = ChannelInterface | UserInterface;

@Component({
  selector: 'app-result-dropdown',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './result-dropdown.component.html',
  styleUrl: './result-dropdown.component.scss'
})
export class ResultDropdownComponent implements OnChanges {
  protected storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  search = inject(SearchService);
  openCloseService = inject(OpenCloseDialogService)

  @Input() userInput: string = "";

  searchResults: SearchResult[] = [];
  public isLargeScreen: boolean = window.innerWidth >= 1201;
  selectedIndex: number = 0;
  dropdownElement: HTMLElement | undefined;

  @ViewChild('dropdown') dropdown!: ElementRef;

  constructor(private viewService: SetMobileViewService) { }


  /**
   * Scrolls to the selected result in the dropdown after the component has finished rendering.
   * This is needed because the dropdown is not yet rendered when the component is initialized,
   * so setting the focus immediately does not work.
   */
  // ngAfterViewInit() {
  //   if (this.searchResults.length > 0) {
  //     this.scrollToSelected();
  //   }
  // }


  /**
   * Lifecycle hook for when the userInput input property changes.
   * Updates the search results if the new value has a length of at least 1.
   * Otherwise, resets the search results to an empty array.
   * @param changes contains the current and previous values of the userInput input property
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['userInput']) {
      const newValue = changes['userInput'].currentValue;
      if (newValue.length >= 1) this.updateFoundedChannelsAndUsers(newValue);
      else this.searchResults = [];
    }
  }


  @HostListener('keydown', ['$event'])
  /**
   * Handles keyboard navigation within the search results dropdown.
   * Intercepts ArrowUp, ArrowDown, Enter, and Escape key presses to manipulate
   * the selection and interaction with the dropdown items.
   * 
   * - ArrowDown: Moves the selection down by one item.
   * - ArrowUp: Moves the selection up by one item.
   * - Enter: Executes the action associated with the currently selected item.
   * - Escape: Clears the search results.
   * 
   * @param event - The KeyboardEvent object representing the user's key press.
   */
  handleKeyDown(event: KeyboardEvent) {
    if (this.searchResults.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveSelection(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveSelection(-1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
          this.handleClick(this.searchResults[this.selectedIndex]);
          this.openCloseService.close("resultDropdown");
          this.search.setUserInput('')
        }
        break;
      case 'Escape':
        this.searchResults = [];
        break;
      default:
        break;
    }
  }


  /**
   * Moves the selection within the search results dropdown by the given delta.
   * If the selection reaches the end of the list, it wraps around to the start.
   * If the selection is moved before the start of the list, it wraps around to the end.
   * After moving the selection, it scrolls the currently selected element into view.
   * @param delta - The number of items to move the selection by.
   */
  moveSelection(delta: number) {
    this.selectedIndex += delta;
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.searchResults.length - 1;
    } else if (this.selectedIndex >= this.searchResults.length) {
      this.selectedIndex = 0;
    }
    this.scrollToSelected();
  }


  /**
   * Scrolls the currently selected element in the dropdown into view.
   * This is done by retrieving the currently selected element from the dropdown
   * and calling scrollIntoView on it with the option { block: 'nearest' }.
   * This ensures that the selected element is scrolled into view without
   * repositioning the entire dropdown.
   */
  scrollToSelected() {
    this.dropdownElement = this.dropdown.nativeElement;
    if (this.dropdownElement) {
      const selectedItem = this.dropdownElement.querySelectorAll('li')[this.selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }



  /**
   * Updates the search results based on the user input.
   * Searches for channels if the input starts with '#', for users if the input starts with '@', and does nothing if the input does not start with either.
   * @param input - The user input string.
   */
  updateFoundedChannelsAndUsers(input: string): void {
    if (input.startsWith('#')) {
      const searchTerm = input.substring(1);
      this.searchResults = this.findChannels(searchTerm);
    } else if (input.startsWith('@')) {
      const searchTerm = input.substring(1);
      this.searchResults = this.findUsers(searchTerm);
    } else {
      this.searchResults = [];
    }
  }


  /**
   * Searches for channels that include the user input in their names.
   * @param searchTerm - The search term entered by the user.
   * @returns An array of ChannelInterface objects matching the search term.
   */
  findChannels(searchTerm: string): ChannelInterface[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }


  /**
   * Searches for users that include the user input in their names.
   * @param searchTerm - The search term entered by the user.
   * @returns An array of UserInterface objects matching the search term.
   */
  findUsers(searchTerm: string): UserInterface[] {
    const users: UserInterface[] = this.storage.user;
    return users.filter(user =>
      user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }


  /**
   * Checks if the user input is a channel name, i.e. it starts with '#'.
   * @returns {boolean} True if the input is a channel name, false otherwise.
   */
  isChannel(): boolean {
    return this.userInput.startsWith('#');
  }


  /**
   * Checks if the user input is a user name, i.e. it starts with '@'.
   * @returns {boolean} True if the input is a user name, false otherwise.
   */
  isUser(): boolean {
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
    let dmId = await this.search.findIdOfDM(result as UserInterface);
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
  * Sets the current view for the application based on the provided view type,
  * aiding in responsive layout management.
  * 
  * @param {CurrentView} view - The view to set (e.g., 'workspaceMenu', 'channel', 'thread').
  */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
