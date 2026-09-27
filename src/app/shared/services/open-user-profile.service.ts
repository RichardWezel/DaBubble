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
   * Opens the conversation with the user matching the given name, creating it
   * on first contact. The conversation id is derived from both user ids, so
   * there is no lookup and no separate "create then navigate" path.
   * @param searchTerm - the user name as submitted
   */
  async showSubmittedDirectMessage(searchTerm: string) {
    const userOfSuggestion = this.storage.user.find(user => user.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
    const currentUserId = this.storage.currentUser.id;
    if (!userOfSuggestion?.id || !currentUserId) return;
    const dmId = await this.storage.ensureDm(currentUserId, userOfSuggestion.id);
    this.navigationService.setChannel(dmId);
  }

}
