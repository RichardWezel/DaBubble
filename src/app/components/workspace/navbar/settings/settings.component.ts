import { Component, inject } from '@angular/core';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { OpenCloseDialogService } from '../../../../shared/services/open-close-dialog.service';
import { OpenUserProfileService } from '../../../../shared/services/open-user-profile.service';


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

  constructor(
    private openUserProfileService: OpenUserProfileService,
    private openCloseDialogService: OpenCloseDialogService) {}

  async openUserProfile() {
    const currentUserId = this.storage.currentUser.id;
    await  this.openUserProfileService.updateUserId(currentUserId!)
    this.openCloseDialogService.open('userProfile');
  }

}
