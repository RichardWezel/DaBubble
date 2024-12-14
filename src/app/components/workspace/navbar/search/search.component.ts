import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { ChannelInterface } from '../../../../shared/interfaces/channel.interface';
import { NavigationService } from '../../../../shared/services/navigation.service';

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

  searchResults: ChannelInterface[] = [];
  userInput: string = "";

  onInput(): void {
    this.updateSearchResults();
  }

  updateSearchResults() {
    if (this.userInput.length >= 2) {
      this.updateFoundedChannels();
    } else {
      this.searchResults = [];
    }
  }

  updateFoundedChannels() {
    if (this.userInput) {
      const matches = this.findChannels(this.userInput);
      this.searchResults = matches;
      console.log("gefundene Übereinstimmungen: ", matches);
    } else {
      this.searchResults = [];
    }
  }

  findChannels(userInput: string): ChannelInterface[] {
    const channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    const matches = channels.filter(channel =>
      channel.name.toLowerCase().startsWith(userInput.toLowerCase())
    );
    console.log("matches: ", matches);
    console.log("findChannels: ", matches.map(channel => channel.name));
    return matches;
  }

  setChannel(channelId: string) {
    this.navigation.setChannel(channelId);
    this.userInput = "";
  }

}
