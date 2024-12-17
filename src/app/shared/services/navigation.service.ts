import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseStorageService } from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  storage = inject(FirebaseStorageService);
  private router = inject(Router);

  channelChanged = new EventEmitter<string>();

  constructor() { }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }


  /**
 * Sets the current channel for the user and stores it in session storage.
 * @param channelId - The ID of the channel to set as current.
 */
  setChannel(channelId: string) {
    this.storage.currentUser.currentChannel = channelId;
    this.storage.currentUser.threadOpen = false;
    sessionStorage.setItem('currentChannel', channelId);
    this.channelChanged.emit(channelId);
  }


}