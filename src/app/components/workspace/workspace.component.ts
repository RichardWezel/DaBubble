import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ChannelComponent } from './channel/channel.component';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
import { ThreadComponent } from './thread/thread.component';
import { FirebaseStorageService } from '../../shared/services/firebase-storage.service';
import { AddChannelDialogComponent } from "./workspace-menu/channel-section/add-channel-dialog/add-channel-dialog.component";
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { FirebaseAuthService } from '../../shared/services/firebase-auth.service';
import { OpenCloseDialogService } from '../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    NavbarComponent,
    WorkspaceMenuComponent,
    ChannelComponent,
    ThreadComponent,
    CommonModule,
    UserProfileComponent
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
  isLargeScreen: boolean = false;
  currentView: 'workspaceMenu' | 'channel' | 'thread' = 'channel'; // Default view

  constructor(
    public openCloseDialogService: OpenCloseDialogService,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('workspaceMenu')
      ?.subscribe((status) => {
        this.wsmOpen = status;
      });
    if (sub) this.subscriptions.add(sub);
 
    // BreakpointObserver für Responsive Design
    const breakpointSub = this.breakpointObserver.observe([`(max-width: 1200px)`]) // Beispielbreite
      .subscribe(result => {
        this.isLargeScreen = result.matches;
        if (!this.isLargeScreen) {
          // Bei kleinen Bildschirmen kann die Ansicht zurückgesetzt werden
          this.currentView = 'channel';
        }
      });
    this.subscriptions.add(breakpointSub);
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

  // Methode zum Wechseln der Ansicht auf großen Bildschirmen
  setView(view: 'workspaceMenu' | 'channel' | 'thread') {
    this.currentView = view;
  }

}

