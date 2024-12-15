import { NgFor, NgIf } from '@angular/common';
import { Component, inject, HostListener } from '@angular/core';
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

  // Index des aktuell ausgewählten Suchergebnisses
  selectedIndex: number = -1;

  onInput(): void {
    this.updateSearchResults();
    this.selectedIndex = -1; // Reset des ausgewählten Index bei neuer Eingabe
  }

  updateSearchResults() {
    if (this.userInput.length >= 2) {
      this.updateFoundedChannels();
    } else {
      this.searchResults = [];
      this.selectedIndex = -1;
    }
  }

  updateFoundedChannels() {
    if (this.userInput) {
      const matches = this.findChannels(this.userInput);
      this.searchResults = matches;
      console.log("gefundene Übereinstimmungen: ", matches);
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
    console.log("matches: ", matches);
    console.log("findChannels: ", matches.map(channel => channel.name));
    return matches;
  }

  setChannel(channelId: string) {
    this.navigation.setChannel(channelId);
    this.userInput = "";
    this.searchResults = [];
    this.selectedIndex = -1;
  }

  // HostListener zum Erfassen von Tastaturereignissen auf der Komponente
  @HostListener('keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.searchResults.length > 0) {
      if (event.key === 'ArrowDown') {
        // Nach unten navigieren
        event.preventDefault(); // Verhindert das Scrollen der Seite
        this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        this.scrollToSelected();
      } else if (event.key === 'ArrowUp') {
        // Nach oben navigieren
        event.preventDefault();
        this.selectedIndex = (this.selectedIndex > 0 ? this.selectedIndex - 1 : this.searchResults.length - 1);
        this.scrollToSelected();
      } else if (event.key === 'Enter') {
        // Ausgewähltes Ergebnis auswählen
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
          this.setChannel(this.searchResults[this.selectedIndex].id!);
        }
      }
    }
  }

  // Methode zum Scrollen zum ausgewählten Element (optional)
  scrollToSelected() {
    const listItems = document.querySelectorAll('.result-container ul li');
    if (this.selectedIndex >= 0 && this.selectedIndex < listItems.length) {
      const selectedItem = listItems[this.selectedIndex] as HTMLElement;
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

}
