import { EventEmitter, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseStorageService } from './firebase-storage.service';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  private router = inject(Router);

  channelChanged = new EventEmitter<string>();

  constructor() { }


  /**
   * Navigates the user to a specific route.
   * @param route - The route where the user gets navigated.
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
  }


  /**
   * Navigates the user to a specific route and resets the error message.
   * @param route - The route where the user gets navigated.
   */
  navigateToAndResetErrorMessage(route: string) {
    this.authService.errorMessage = '';
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