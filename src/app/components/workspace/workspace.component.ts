import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ChannelComponent } from './channel/channel.component';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
import { ThreadComponent } from './thread/thread.component';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';
import { UserProfileComponent } from '../../shared/components/dialog/user-profile/user-profile.component';
import { FirebaseAuthService } from '../../shared/services/firebase-auth.service';
import { OpenCloseDialogService } from '../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SetMobileViewService, CurrentView } from '../../shared/services/set-mobile-view.service';
import { AddChannelComponent } from '../../shared/components/dialog/add-channel/add-channel.component';
import { SelectionOfAddingChannelMembersComponent } from '../../shared/components/dialog/selection-of-adding-channel-members/selection-of-adding-channel-members.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    NavbarComponent,
    WorkspaceMenuComponent,
    ChannelComponent,
    ThreadComponent,
    CommonModule,
    UserProfileComponent,
    AddChannelComponent,
    SelectionOfAddingChannelMembersComponent
  ],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  wsmOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();
  public isLargeScreen: boolean = window.innerWidth >= 1301;
  currentView: 'workspaceMenu' | 'channel' | 'thread' = 'channel'; // Default view


  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    private breakpointObserver: BreakpointObserver,
    private viewService: SetMobileViewService // Injektion des ViewService
  ) { }


  /**
   * Subscribes to dialog, breakpoint, and view state changes to manage the workspace layout and functionality.
   */
  ngOnInit(): void {
    const dialogSub = this.openCloseDialogService.isDialogOpen('workspaceMenu')?.subscribe(
      status => this.wsmOpen = status
    );
    if (dialogSub) this.subscriptions.add(dialogSub);

    this.subscriptions.add(
      this.breakpointObserver.observe([`(min-width: 1300px)`]).subscribe(result => {
        this.viewService.setIsLargeScreen(result.matches);
        if (!result.matches) this.viewService.setCurrentView('workspaceMenu');
      })
    );

    this.subscriptions.add(
      this.viewService.currentView$.subscribe(view => this.currentView = view)
    );

    this.subscriptions.add(
      this.viewService.isLargeScreen$.subscribe(isLarge => this.isLargeScreen = isLarge)
    );
  }


  /**
   * Unsubscribes from all active subscriptions to prevent memory leaks when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Triggers when mouse movement, keydown, click, or keyup events occur to refresh the online status timer.
   */
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:keydown', ['$event'])
  @HostListener('document:click', ['$event'])
  @HostListener('document:keyup', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.authService.onlineStatusTimer(true);
  }


  /**
   * Handles keyboard events to maintain user activity status.
   * This method triggers when any key is pressed and invokes the online status timer of the authentication service.
   * 
   * @param {KeyboardEvent} event - The keyboard event triggered by the user pressing a key.
   */
  onKeydown(event: KeyboardEvent) {
    this.authService.onlineStatusTimer(true);
  }


  /**
  * Toggles the visibility of the workspace menu.
  */
  toggleMenu(): void {
    this.wsmOpen = !this.wsmOpen;

  }


  /**
   * Sets the current view within the workspace, managing how components like the menu, channel, or thread are displayed.
   * @param {CurrentView} view - The new view to set in the workspace.
   */
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }

}

