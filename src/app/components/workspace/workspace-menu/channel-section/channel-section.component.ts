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

  storage = inject(FirebaseStorageService);

  isListVisible: boolean = true;

  toggleList() {
    this.isListVisible = !this.isListVisible;
  }
}
