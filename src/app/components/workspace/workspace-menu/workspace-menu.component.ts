import { Component, inject } from '@angular/core';
import { HeadSectionComponent } from './head-section/head-section.component';
import { ChannelSectionComponent } from './channel-section/channel-section.component';
import { DmSectionComponent } from './dm-section/dm-section.component';
import { SetMobileViewService, CurrentView } from '../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-workspace-menu',
  standalone: true,
  imports: [
    HeadSectionComponent,
    ChannelSectionComponent,
    DmSectionComponent
  ],
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.scss']
})
export class WorkspaceMenuComponent {

  navigationService = inject(NavigationService);
  isLargeScreen: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private viewService: SetMobileViewService) { }

  /**
   * Initializes by subscribing to the screen size state to adapt the UI based on device size.
   */
  ngOnInit(): void {
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }


  /**
   * Unsubscribes from all subscriptions to clean up resources and prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Handles click actions on the header section, setting the navigation to a new message channel
   * and adjusting the view accordingly if not on a large screen.
   */
  handleClick() {
    this.navigationService.setChannel('newMessage')
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }


  /**
   * Changes the current view of the application based on the given view type.
   * This method controls how different parts of the application are displayed,
   * especially in response to changes in device orientation or screen size.
   *
   * @param {CurrentView} view - The view type to set (e.g., 'workspaceMenu', 'channel', 'thread').
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
