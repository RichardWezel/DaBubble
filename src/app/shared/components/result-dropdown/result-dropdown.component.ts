import { Component, Input, inject, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
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
  openCloseService = inject(OpenCloseDialogService);
  elementRef = inject(ElementRef);

  @Input() userInput: string = "";

  searchResults: SearchResult[] = [];
  public isLargeScreen: boolean = window.innerWidth >= 1300;
  selectedIndex: number = -1;
  dropdownElement: HTMLElement | undefined;

  @ViewChild('dropdown') dropdown!: ElementRef;

  constructor(private viewService: SetMobileViewService) { }


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
   * Handles keydown events for navigating through and selecting search results.
   * Prevents default actions for ArrowDown, ArrowUp, Enter, and Escape keys.
   * Moves the selection up or down, selects the highlighted result,
   * or closes the dropdown based on the pressed key.
   * 
   * @param event - The KeyboardEvent object encapsulating the keydown event.
   */
  handleKeyDown(event: KeyboardEvent) {
    if (this.searchResults.length === 0) return;
    const keysToPrevent = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
    if (keysToPrevent.includes(event.key)) event.preventDefault();
    const keyActions: { [key: string]: () => void } = {
      ArrowDown: () => this.moveSelection(1),
      ArrowUp: () => this.moveSelection(-1),
      Enter: () => this.handleEnter(),
      Escape: () => this.handleEscape(),
    };
    keyActions[event.key]?.();
  }


  /**
   * Handles the Enter key event.
   * Selects the currently highlighted search result by calling `handleClick` and
   * closes the dropdown by calling `close` on the `openCloseService`.
   */
  private handleEnter(): void {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
      this.handleClick(this.searchResults[this.selectedIndex]);
      this.openCloseService.close("resultDropdown");
    }
  }


  /**
   * Handles the Escape key event.
   * Resets the search results to an empty array and closes the dropdown by calling `close` on the `openCloseService`.
   * Additionally, it focuses the search input field by calling `focus` on the element with id 'searchbar'.
   */
  private handleEscape(): void {
    this.searchResults = [];
    this.openCloseService.close("resultDropdown");
    (document.getElementById('searchbar') as HTMLInputElement)?.focus();
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
   * Updates the search results based on the current user input.
   * Searches for channels if the input starts with '#', and for users if the input starts with '@'.
   * Resets the search results if the input does not start with either of these prefixes.
   * Closes the dropdown if the search results are empty.
   * @param input - The input string entered by the user.
   */
  updateFoundedChannelsAndUsers(input: string): void {
    if (!input.startsWith('#') && !input.startsWith('@')) {
      this.searchResults = [];
      return;
    }
    const searchTerm = input.substring(1);
    this.searchResults = input.startsWith('#') ? this.findChannels(searchTerm) : this.findUsers(searchTerm);
    this.closeDropdownIfEmpty();
  }


  /**
   * Closes the dropdown if the search results are empty.
   * This function is called at the end of updateFoundedChannelsAndUsers.
   * It checks if the search results are empty, and if so, calls openCloseService.close('resultDropdown')
   * after a timeout of 0 milliseconds to close the dropdown.
   */
  private closeDropdownIfEmpty(): void {
    if (this.searchResults.length === 0) {
      setTimeout(() => this.openCloseService.close('resultDropdown'), 0);
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
