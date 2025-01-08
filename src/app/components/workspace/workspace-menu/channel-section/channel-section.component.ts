import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { FormsModule } from '@angular/forms';
import { AddChannelDialogComponent } from "./add-channel-dialog/add-channel-dialog.component";
import { NavigationService } from '../../../../shared/services/navigation.service';
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../shared/services/open-close-dialog.service';

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgIf, FormsModule, NgClass],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent {

  @ViewChild('addChannelDialog') addChannelDialogComponent!: AddChannelDialogComponent;

  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  isLargeScreen: boolean = false;
  isListVisible: boolean = true;
  private subscriptions: Subscription = new Subscription();


  constructor(private viewService: SetMobileViewService, public openCloseDialogService: OpenCloseDialogService) {}


  /**
   * Subscribes to the view service to track if the device is displaying on a large screen
   * and adjusts the UI components accordingly.
   */
  ngOnInit(): void {
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }


  /**
   * Unsubscribes from all active subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Toggles the visibility of the channel list within the UI.
   */
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }


  /**
   * Opens the dialog to add a new channel, interfacing with the OpenCloseDialogService.
   */
  openAddChannelDialog() {
    this.openCloseDialogService.open('addChannel');
  }


  /**
   * Handles the selection of a channel by setting the current channel in the navigation service,
   * and potentially changing the view based on the screen size.
   * 
   * @param {string} channelId - The ID of the channel to navigate to.
   */
  handleClick(channelId: string) {
    this.navigationService.setChannel(channelId)
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }


  /**
   * Sets the current view for the application based on the provided view type,
   * aiding in responsive layout management.
   * 
   * @param {CurrentView} view - The view to set (e.g., 'workspaceMenu', 'channel', 'thread').
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
