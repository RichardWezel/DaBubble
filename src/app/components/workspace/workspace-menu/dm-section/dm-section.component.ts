import { Component, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';
import { DmInterface } from '../../../../shared/interfaces/dm.interface';

@Component({
  selector: 'app-dm-section',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dm-section.component.html',
  styleUrl: './dm-section.component.scss'
})
export class DmSectionComponent {
  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  cloud = inject(CloudStorageService);
  isLargeScreen: boolean = false;
  isListVisible: boolean = true;
  private subscriptions: Subscription = new Subscription();


  constructor(private viewService: SetMobileViewService) { }


  /**
   * Initializes component by subscribing to screen size changes to adjust the UI.
   */
  ngOnInit(): void {
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }


  /**
   * Cleans up subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * The current user's direct message conversations.
   * @returns {DmInterface[]} conversations the current user takes part in
   */
  dmList(): DmInterface[] {
    return this.storage.dms;
  }


  /**
   * The person on the other side of a conversation.
   * @param {DmInterface} dm - the conversation
   * @returns {string} the contact's user id
   */
  contactOf(dm: DmInterface): string {
    return this.storage.dmContact(dm.id);
  }


  /**
   * Display name of a conversation's contact.
   * @param {DmInterface} dm - the conversation
   * @returns {string} the contact's name, marked with "(Du)" for the self-conversation
   */
  dmIndex(dm: DmInterface) {
    const contact = this.contactOf(dm);
    const name = this.storage.user.find(user => user.id === contact)?.name;
    if (contact === this.storage.currentUser.id) return name + ' (Du)';
    return name;
  }


  /**
   * Avatar of a conversation's contact.
   * @param {DmInterface} dm - the conversation
   * @returns {string} url or asset path of the avatar
   */
  getDmAvatar(dm: DmInterface) {
    const avatar = this.storage.user.find(user => user.id === this.contactOf(dm))?.avatar ?? '';
    return avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + avatar : this.cloud.openImage(avatar);
  }


  /**
   * Finds and returns the avatar URL or path for a given user ID.
   * @param {string} user - The user ID to search for.
   * @returns {string} The avatar URL or an empty string if not found.
   */
  findAvatar(user: string) {
    let avatar = this.storage.user.find(u => u.id === user)?.avatar;
    if (avatar) return avatar;
    else return '';
  }


  /**
   * Toggles the visibility of the direct message list.
   */
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }


  /**
   * Navigates to the sign-in page.
   */
  goToSignIn() {
    this.navigationService.navigateTo('/signin');
  }


  /**
   * Handles click events on direct message entries to navigate to the respective DM channel.
   * @param {string} dmId - The ID of the direct message to navigate to.
   */
  handleClick(dmId: string) {
    this.navigationService.setChannel(dmId)
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }


  /**
   * Sets the current view of the application based on the given view type, especially useful for responsive layouts.
   * @param {CurrentView} view - The view to set.
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }


  /**
   * Checks if a direct message (DM) contact exists in the user list.
   * @param {object} dm - The direct message object containing contact details.
   * @returns {boolean} True if the contact exists, false otherwise.
   */
  findContact(dm: DmInterface): boolean {
    return this.storage.user.some(user => user.id === this.contactOf(dm));
  }
}
