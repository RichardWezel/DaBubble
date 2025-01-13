import { Component, inject, Renderer2, ElementRef, HostBinding, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { OpenCloseDialogService } from '../../../../shared/services/open-close-dialog.service';
import { NgIf } from '@angular/common';
import { SetMobileViewService } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent  implements OnInit, OnDestroy{

  @Input() open: boolean = false;
  @Output() close = new EventEmitter<void>();
  @HostBinding('class.open') get isOpen() {
    return this.open;
  }

  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  openCloseDialogService = inject(OpenCloseDialogService);

  isLargeScreen: boolean = false;

  private subscriptions: Subscription = new Subscription();


   constructor(
    private viewService: SetMobileViewService
   ) {}

  
  /**
   * Opens the user profile dialog and emits an event to close the settings dropdown.
   */
  openUserProfile() {
    this.openCloseDialogService.changeProfileId(this.storage.currentUser.id!);
    this.openCloseDialogService.open('userProfile');
    this.close.emit(); // Optional: Dropdown nach dem Öffnen schließen
    console.log('User profile opened and dropdown closed.');
  }


  /**
   * Initializes subscriptions to manage UI responsiveness based on screen size.
   */
  ngOnInit(): void {

    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }


  /**
   * Cleans up all active subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  

  /**
   * Toggles the dropdown close state and emits an event to signal this change.
   */
  toggleDropdown(): void {
    this.close.emit(); // Emitiert das `close`-Ereignis
    console.log('Dropdown closed via toggle.');
  }

}
