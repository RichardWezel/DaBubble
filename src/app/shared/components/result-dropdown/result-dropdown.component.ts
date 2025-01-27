import { Component, Input, inject, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NgFor, NgIf, } from '@angular/common';
import { ChannelInterface } from '../../interfaces/channel.interface';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NavigationService } from '../../services/navigation.service';
import { SetMobileViewService, CurrentView } from '../../services/set-mobile-view.service';
import { SearchService } from '../../services/search.service';

type SearchResult = ChannelInterface | UserInterface;

@Component({
  selector: 'app-result-dropdown',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './result-dropdown.component.html',
  styleUrl: './result-dropdown.component.scss'
})
export class ResultDropdownComponent implements OnChanges, AfterViewInit {
  protected storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  search = inject(SearchService);
  searchResults: SearchResult[] = [];
  @Input() userInput: string = "";
  public isLargeScreen: boolean = window.innerWidth >= 1201;
  selectedIndex: number = 0;
  dropdownElement: HTMLElement | undefined;

  @ViewChild('dropdown') dropdown!: ElementRef;

  constructor(private viewService: SetMobileViewService) { }

  ngAfterViewInit() {
    if (this.searchResults.length > 0) {
      this.scrollToSelected();
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.searchResults.length === 0) {
      return;
    }

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
        }
        break;
      case 'Escape':
        // Optional: Schließen Sie das Dropdown bei Escape
        this.searchResults = [];
        break;
      default:
        break;
    }
  }

  moveSelection(delta: number) {
    this.selectedIndex += delta;
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.searchResults.length - 1;
    } else if (this.selectedIndex >= this.searchResults.length) {
      this.selectedIndex = 0;
    }

    this.scrollToSelected();
  }

  scrollToSelected() {
    this.dropdownElement = this.dropdown.nativeElement;
    if (this.dropdownElement) {
      console.log(this.dropdownElement, this.selectedIndex);
      const selectedItem = this.dropdownElement.querySelectorAll('li')[this.selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }

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
