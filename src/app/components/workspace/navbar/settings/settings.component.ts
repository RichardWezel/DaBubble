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

  @Input() open: boolean = false; // Neue Input-Eigenschaft
  @Output() close = new EventEmitter<void>(); // Neue Output-Eigenschaft

  @HostBinding('class.open') get isOpen() {
    return this.open;
  }

  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isLargeScreen: boolean = false;
  private subscriptions: Subscription = new Subscription();

   constructor(
    private viewService: SetMobileViewService,
    private renderer: Renderer2, // For manipulating classes
    private el: ElementRef // To access DOM elements
   ) {}

  openUserProfile() {
    this.openCloseDialogService.changeProfileId(this.storage.currentUser.id!);
    this.openCloseDialogService.open('userProfile');
    this.close.emit(); // Optional: Dropdown nach dem Öffnen schließen
    console.log('User profile opened and dropdown closed.');
  }

  ngOnInit(): void {

    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Methode zum Schließen des Dropdowns
  toggleDropdown(): void {
    this.close.emit(); // Emitiert das `close`-Ereignis
    console.log('Dropdown closed via toggle.');
  }

}
