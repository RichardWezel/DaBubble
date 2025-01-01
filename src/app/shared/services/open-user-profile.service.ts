import { Injectable, inject } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { UserInterface } from '../interfaces/user.interface';
import { NavigationService } from './navigation.service';

@Injectable({
  providedIn: 'root'
})
export class OpenUserProfileService {

  protected storage = inject(FirebaseStorageService);
  protected navigationService = inject(NavigationService);


  constructor() { }

  /**
 * Sets the current Channel of current User to the submitted direct message user. 
 * If a dm already exists, it will be shown, 
 * otherwise a new dm will be created for the affected users (current user and submitted user) and shown.
 * 
 * @param {string} searchTerm - user name as submitted
 */
  async showSubmittedDirectMessage(searchTerm: string) {
    console.log(searchTerm);
    const userOfSuggestion = this.storage.user.find(user => user.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
    console.log(userOfSuggestion);
    console.log(this.findUserInDms(userOfSuggestion!));
    if (!userOfSuggestion) return;
    if (this.findUserInDms(userOfSuggestion)) this.showExistingDm(userOfSuggestion)
    else await this.showNewDm(userOfSuggestion);
  }


  /**
   * Shows existing direct messages in the channel between the current user and a specified user.
   * @param userOfSuggestion - The user for whom to find the exiting DMs.
   */
  showExistingDm(userOfSuggestion: UserInterface) {
    let dmsOfCurrentUser = this.storage.user.find(user => user.id === this.storage.currentUser.id)!.dm;
    let dmWithUserOfSuggestion = dmsOfCurrentUser.find(dm => dm.contact === userOfSuggestion.id);
    this.navigationService.setChannel(dmWithUserOfSuggestion!.id);
  }


  /**
   * Creates a new direct message with the specified user if it doesn't already exist and shows the DMs.
   * @param userOfSuggestion - The user for whom to create or navigate to a DM channel.
   */
  async showNewDm(userOfSuggestion: UserInterface) {
    await this.createEmptyDms(userOfSuggestion);
    this.showExistingDm(userOfSuggestion);
  }


  /**
   * Checks if a direct message (DM) exists between the current user and a specified user.
   * @param userOfSuggestion - The user to search for in the current user's DMs.
   * @returns - 'True' if a DM with the specified user exists, 'false' otherwise.
   */
  findUserInDms(userOfSuggestion: UserInterface): boolean {
    return this.storage.currentUser.dm.some(dm => dm.contact === userOfSuggestion.id);
  }


  /**
   * Searches for a user in the current user's direct messages.
   * @param foundUser - The user to search for in the current user's DMs.
   * @returns - The matching user object if found, or 'undefined' if no match exists.
   */
  findUserInCurrentUserDms(foundUser: UserInterface): object | undefined {
    let match = this.storage.currentUser.dm.find(user => user.id === foundUser.id);
    return match
  }


  /**
   * Creates new empty direct message between the current user and a specified user.
   * @param userOfSuggestion - The user hwom to create mutual empty DM.
   */
  async createEmptyDms(userOfSuggestion: UserInterface) {
    let currentUserId = this.storage.currentUser.id;
    let suggestedUserId = userOfSuggestion.id;
    if (currentUserId && suggestedUserId) {
      await this.storage.createNewEmptyDm(currentUserId, suggestedUserId);
      await this.storage.createNewEmptyDm(suggestedUserId, currentUserId);
    }
  }

}
