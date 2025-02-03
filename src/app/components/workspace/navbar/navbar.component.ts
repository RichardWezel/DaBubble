import { Component, HostListener, ElementRef, inject, } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { SettingsComponent } from "./settings/settings.component";
import { SearchComponent } from '../navbar/search/search.component';
import { SetMobileViewService, CurrentView } from '../../../shared/services/set-mobile-view.service';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SettingsComponent, SearchComponent, NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  dropDownOpen: boolean = false;
  backToWsMenuIcon: boolean = false;
  isLargeScreen: boolean = false;
  currentView: CurrentView = 'workspaceMenu';

  private subscriptions: Subscription = new Subscription();

  constructor(private viewService: SetMobileViewService) {
  }


  /**
   * Initializes subscriptions to manage changes in the UI based on screen size and current view updates from the viewService.
   */
  ngOnInit(): void {
    const viewSub = this.viewService.currentView$.subscribe(view => {
      this.currentView = view;
    });
    this.subscriptions.add(viewSub);

    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
    
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event) {
      this.isLargeScreen = window.innerWidth >= 1300;
    }
   
  }


  /**
   * Cleans up all active subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Closes the user dropdown menu if a click event occurs outside of the dropdown area.
   * @param {MouseEvent} event - The mouse event triggered when clicking in the document.
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }


  /**
   * Manages the navigation of the workspace based on the current view.
   * If the current view is the channel view, it navigates to the workspace menu.
   * If the current view is the thread view, it navigates to the channel view.
   */
  handleSetView() {
    if (this.currentView === 'channel') {
      this.setView('workspaceMenu');
    }
    if (this.currentView === 'thread') {
      this.setView('channel');
    }
  }


  /**
   * Sets the current view using the view service, facilitating state management across different components.
   * @param {CurrentView} view - The new view to be set in the navbar and potentially other parts of the UI.
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }


  /**
   * Condition for displaying backToWs-menu-btn.
   * 
   * @returns 
   */
  displayCondition(): boolean {
    let condition = !this.isLargeScreen && (this.currentView === 'channel' || this.currentView === 'thread');
    return condition;
  }

}