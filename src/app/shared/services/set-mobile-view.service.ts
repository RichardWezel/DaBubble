import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Defines the possible views within the workspace.
 */
export type CurrentView = 'workspaceMenu' | 'channel' | 'thread';

/**
 * Service to manage the current view and screen size state for responsive design.
 * 
 * This service uses BehaviorSubjects to hold the current view and screen size state,
 * allowing components to subscribe and react to changes in these states.
 */
@Injectable({
  providedIn: 'root'
})

export class SetMobileViewService {

  /**
   * BehaviorSubject holding the current view state.
   * Initialized to 'workspaceMenu'.
   */
  private currentViewSubject: BehaviorSubject<CurrentView> = new BehaviorSubject<CurrentView>('workspaceMenu');

  /**
   * Observable stream of the current view state.
   */
  public currentView$: Observable<CurrentView> = this.currentViewSubject.asObservable();

  /**
   * BehaviorSubject holding the screen size state.
   * `true` indicates a large screen, `false` indicates a small screen.
   * Initialized to `false`.
   */
  private isLargeScreenSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * Observable stream of the screen size state.
   */
  public isLargeScreen$: Observable<boolean> = this.isLargeScreenSubject.asObservable();

  constructor() { }
 
  /**
   * Sets the current view.
   * 
   * @param view - The new view to set. Must be one of 'workspaceMenu', 'channel', or 'thread'.
   */
  setCurrentView(view: CurrentView): void {
    this.currentViewSubject.next(view);
  }

  /**
   * Retrieves the current view.
   * 
   * @returns The current view as a `CurrentView` type.
   */
  getCurrentView(): CurrentView {
    return this.currentViewSubject.value;
  }
  /**
   * Sets the screen size state.
   * 
   * @param isLarge - A boolean indicating if the screen is large (`true`) or small (`false`).
   */
  setIsLargeScreen(isLarge: boolean): void {
    this.isLargeScreenSubject.next(isLarge);
  }

  /**
   * Retrieves the current screen size state.
   * 
   * @returns A boolean indicating if the screen is large (`true`) or small (`false`).
   */
  getIsLargeScreen(): boolean {
    return this.isLargeScreenSubject.value;
  }
}