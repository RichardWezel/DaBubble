import { Component, inject } from '@angular/core';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { OpenCloseDialogService } from '../../../../shared/services/open-close-dialog.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  openCloseDialogService = inject(OpenCloseDialogService);

  constructor() { }

  openUserProfile() {
    this.openCloseDialogService.changeProfileId(this.storage.currentUser.id!);
    this.openCloseDialogService.open('userProfile');
  }

}
