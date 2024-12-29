import { Component, inject, } from '@angular/core';
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
export class SettingsComponent {

  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isLargeScreen: boolean = false;
  private subscriptions: Subscription = new Subscription();

   constructor(private viewService: SetMobileViewService) {}

  openUserProfile() {
    this.openCloseDialogService.changeProfileId(this.storage.currentUser.id!);
    this.openCloseDialogService.open('userProfile');
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

}
