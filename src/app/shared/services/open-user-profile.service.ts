import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirebaseStorageService } from './firebase-storage.service';
import { UserInterface } from '../interfaces/user.interface';
import { NavigationService } from './navigation.service';

@Injectable({
  providedIn: 'root'
})
export class OpenUserProfileService {

  protected storage = inject(FirebaseStorageService);
  protected navigationService = inject(NavigationService);

  private userIDSource = new BehaviorSubject<string>('');
  userID$ = this.userIDSource.asObservable();

  updateUserId(user: string) {
    this.userIDSource.next(user);
    console.log('OpenUserProfileService: userName: ', this.userID$)
  }

  constructor() { }

    /**
   * Sets the current Channel of current User to the submitted direct message user. 
   * If a dm already exists, it will be shown, 
   * otherwise a new dm will be created for the affected users (current user and submitted user) and shown.
   * 
   * @param {string} searchTerm - user name as submitted
   */
    showSubmittedDirectMessage(searchTerm: string) {
      const userOfSuggestion = this.storage.user.find(user => user.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
  
      if (userOfSuggestion && this.findUserInDms(userOfSuggestion)) {
        this.showExistingDm(userOfSuggestion)
      } else if (userOfSuggestion && !this.findUserInDms(userOfSuggestion)) {
        this.showNewDm(userOfSuggestion)
      }
    }
  
    showExistingDm(userOfSuggestion: UserInterface) {
      let dmsOfCurrentUser = this.storage.currentUser.dm;
      let dmWithUserOfSuggestion = dmsOfCurrentUser.find(dm => dm.contact === userOfSuggestion.id);
      this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
    }
  
    async showNewDm(userOfSuggestion: UserInterface) {
      await this.createEmptyDms(userOfSuggestion);
      let dmWithUserOfSuggestion = this.storage.currentUser.dm.find(dm => dm.contact === userOfSuggestion.id);
      if (dmWithUserOfSuggestion) this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
    }

    findUserInDms(userOfSuggestion: UserInterface): boolean {
      return this.storage.currentUser.dm.some(dm => dm.contact === userOfSuggestion.id);
    }
  
    findUserInCurrentUserDms(foundUser: UserInterface) {
      let match = this.storage.currentUser.dm.find(user => user.id === foundUser.id);
      return match
    }

    async createEmptyDms(userOfSuggestion: UserInterface) {
      let currentUserId = this.storage.currentUser.id;
      let suggestedUserId = userOfSuggestion.id;
      if (currentUserId && suggestedUserId) {
        await this.storage.createNewEmptyDm(currentUserId, suggestedUserId);
        await this.storage.createNewEmptyDm(suggestedUserId, currentUserId);
      }
    }
  
}
