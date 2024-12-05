import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { SearchComponent } from "./search/search.component";
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { FirebaseAuthService } from '../../../shared/services/firebase-auth.service';
import { OpenCloseDialogService } from '../../../shared/services/open-close-dialog.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { NgIf } from '@angular/common';
import { SettingsComponent } from "./settings/settings.component";


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SearchComponent, SettingsComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);

  dropDownOpen: boolean = false;

  constructor(
    private openUserProfileService: OpenUserProfileService,
    private openCloseDialogService: OpenCloseDialogService) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

  async openUserProfile() {
    const currentUserId = this.storage.currentUser.id;
    await  this.openUserProfileService.updateUserId(currentUserId!)
    this.openCloseDialogService.open('userProfile');
  }

}
