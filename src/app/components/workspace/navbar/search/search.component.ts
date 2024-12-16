import { NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { ChannelInterface } from '../../../../shared/interfaces/channel.interface';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { UserInterface } from '../../../../shared/interfaces/user.interface';

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

  searchResults: (ChannelInterface | UserInterface)[] = [];
  userInput: string = "";
  selectedIndex: number = -1;

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
      const channelMatches: ChannelInterface[] = this.findChannels(this.userInput);
      const userMatches: UserInterface[] = this.findUser(this.userInput);
      this.searchResults = [...channelMatches, ...userMatches];
      console.log("gefundene Kanäle: ", channelMatches);
      console.log("gefundene Benutzer: ", userMatches);
    } else {
      this.searchResults = [];
      this.selectedIndex = -1;
    }
  }

  findChannels(userInput: string): ChannelInterface[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    const matches = channels.filter(channel =>
      channel.name.toLowerCase().startsWith(userInput.toLowerCase())
    );
    console.log("channels matches: ", matches);
    return matches;
  }

  findUser(userInput: string): UserInterface[] {
    const users: UserInterface[] = this.storage.user;
    const matches = users.filter(user =>
      user.name.toLowerCase().startsWith(userInput.toLowerCase())
    );
    console.log("user matches: ", matches);
    return matches;
  }

  async setChannel(result: ChannelInterface | UserInterface): Promise<void> {
    if (result.type === "channel") {
      if (result.id) {
        this.navigation.setChannel(result.id);
        console.log("this.navigation.setChannel(", result.id, ")")
      } else {
        console.error('Channel id is undefined.');
        return;
      }
    }
    
    if (result.type === "user") {
      let dmId = await this.findIdOfDM(result);
      if (dmId) {
        this.navigation.setChannel(dmId);
      } else {
        console.error('DM id is undefined.');
        return;
      }
    }
    
    this.userInput = "";
    this.searchResults = [];
    this.selectedIndex = -1;
  }
  

  async findIdOfDM(result: UserInterface): Promise<string | undefined> {
    const UserMatch = this.storage.user.find(user => user.name.toLowerCase().startsWith(result.name.toLowerCase()));
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
    return dm ? dm.contact : undefined;
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

}
