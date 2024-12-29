import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ChannelComponent } from './channel/channel.component';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
import { ThreadComponent } from './thread/thread.component';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { FirebaseAuthService } from '../../shared/services/firebase-auth.service';
import { OpenCloseDialogService } from '../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SetMobileViewService, CurrentView } from '../../shared/services/set-mobile-view.service';

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
  ],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  wsmOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();

  // Responsive Layout
  public isLargeScreen: boolean = window.innerWidth >= 1201;
  currentView: 'workspaceMenu' | 'channel' | 'thread' = 'channel'; // Default view

  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    private breakpointObserver: BreakpointObserver,
    private viewService: SetMobileViewService // Injektion des ViewService
  ) { }

  ngOnInit(): void {
    // Subscribe to workspace menu dialog status
    const dialogSub = this.openCloseDialogService
      .isDialogOpen('workspaceMenu')
      ?.subscribe((status) => {
        this.wsmOpen = status;
      });
    if (dialogSub) this.subscriptions.add(dialogSub);

    // BreakpointObserver for Responsive Design
    const breakpointSub = this.breakpointObserver.observe([`(min-width: 1201px)`]) // Corrected breakpoint for large screens
      .subscribe(result => {
        const isLarge = result.matches;
        this.viewService.setIsLargeScreen(isLarge);
        if (!isLarge) {
          this.viewService.setCurrentView('workspaceMenu');
        }
      });
    this.subscriptions.add(breakpointSub);

    // Subscribe to currentView changes
    const viewSub = this.viewService.currentView$.subscribe(view => {
      this.currentView = view;
    });
    this.subscriptions.add(viewSub);

    // Subscribe to isLargeScreen changes and update local variable
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge; // Update local isLargeScreen
    });
    this.subscriptions.add(screenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:keydown', ['$event'])
  @HostListener('document:click', ['$event'])
  @HostListener('document:keyup', ['$event'])

  onMouseMove(event: MouseEvent) {
    this.authService.onlineStatusTimer(true);
  }

  onKeydown(event: KeyboardEvent) {
    this.authService.onlineStatusTimer(true);
  }

  toggleMenu(): void {
    this.wsmOpen = !this.wsmOpen;

  }

  // Methode zum Wechseln der Ansicht über den Service
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }

}

