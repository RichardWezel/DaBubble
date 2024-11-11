import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent {
  // Injecting the Firebase storage service
  storage = inject(FirebaseStorageService);

  // An array for storing channel names
  channels: string[] = ['Entwicklerteam', 'Marketing', 'Vertrieb', 'Support'];

  // Status variable to control visibility of the channel list
  isListVisible: boolean = true;

  // Method to toggle the visibility of the list
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }
}
