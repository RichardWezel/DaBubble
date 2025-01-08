import { Component, inject } from '@angular/core';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { SearchComponent } from '../../navbar/search/search.component'; 
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-head-section',
  standalone: true,
  imports: [SearchComponent],
  templateUrl: './head-section.component.html',
  styleUrl: './head-section.component.scss'
})
export class HeadSectionComponent {

  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  isLargeScreen: boolean = false;
  private subscriptions: Subscription = new Subscription();


  constructor(private viewService: SetMobileViewService) {}


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
