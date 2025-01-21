import { Component, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dm-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
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
   * Retrieves the index of the current user within the user list.
   * @returns {string} Index of the current user.
   */
  currentUserIndex() {
    return this.storage.user.findIndex(user => user.id === this.storage.currentUser.id);
  }


  /**
   * Returns the display name for a direct message contact.
   * @param {object} dm - The direct message object containing contact details.
   * @returns {string} Display name of the contact.
   */
  dmIndex(dm: { contact: string, id: string, posts: any[] }) {
    let name = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.name;
    if (dm.contact === this.storage.currentUser.id) return name + ' (Du)';
    else return name;
  }


  /**
   * Retrieves and returns the avatar for a direct message contact.
   * @param {object} dm - The direct message object containing contact details.
   * @returns {string} Avatar URL or path for the contact.
   */
  getDmAvatar(dm: { contact: string, id: string, posts: any[] }) {
    // let avatar = this.findAvatar(dm.contact).startsWith('profile-') ? 'assets/img/profile-pictures/' + this.findAvatar(dm.contact) : this.cloud.openImage(this.findAvatar(dm.contact));
    let avatar: string = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.avatar;
    avatar = avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + avatar : this.cloud.openImage(avatar);
    return avatar;
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
    console.log(dmId)
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
}
