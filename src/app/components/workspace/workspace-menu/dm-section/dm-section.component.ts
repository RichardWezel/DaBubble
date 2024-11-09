import { Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-dm-section',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './dm-section.component.html',
  styleUrl: './dm-section.component.scss'
})
export class DmSectionComponent {
  storage = inject(FirebaseStorageService);

  // wsMembers = [
  //   {
  //     "name": "Frederik Beck",
  //     "online": true,
  //     "logged-profile": true
  //   },
  //   {
  //     "name": "Sofia Müller",
  //     "online": true,
  //     "logged-profile": false
  //   },
  //   {
  //     "name": "Noah Braun",
  //     "online": false,
  //     "logged-profile": false
  //   },
  //   {
  //     "name": "Elise Roth",
  //     "online": true,
  //     "logged-profile": false
  //   },
  //   {
  //     "name": "Elias Neumann",
  //     "online": true,
  //     "logged-profile": false
  //   },
  //   {
  //     "name": "Steffen Hoffmann",
  //     "online": true,
  //     "logged-profile": false
  //   },
  // ];

  // Statusvariable zur Steuerung der Sichtbarkeit
  isListVisible: boolean = true;


  currentUserIndex() {
    return this.storage.user.findIndex(user => user.id === this.storage.currentUser.id);
  }

  dmIndex(dm: { contact: string, id: string, posts: any[] }) {
    let name = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.name;
    if (dm.contact === this.storage.currentUser.id) return name + ' (Du)';
    else return name;
  }

  // Methode zum Umschalten des Status
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }
}
