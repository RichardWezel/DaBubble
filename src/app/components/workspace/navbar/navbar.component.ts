import { Component, HostListener, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { FirebaseAuthService } from '../../../shared/services/firebase-auth.service';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../shared/services/open-close-dialog.service';
import { OpenUserProfileService } from '../../../shared/services/open-user-profile.service';
import { SettingsComponent } from "./settings/settings.component";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SettingsComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  cloud = inject(CloudStorageService);

  currentUserName: string = '';
  dropDownOpen: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private openUserProfileService: OpenUserProfileService,
    private openCloseDialogService: OpenCloseDialogService) { }

  ngOnInit(): void {
    if (this.storage.currentUser$) {
      const sub = this.storage.currentUser$.subscribe(user => {
        this.currentUserName = user.name;
      });
      this.subscriptions.add(sub);
    }

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

  async openUserProfile() {
    const currentUserId = this.storage.currentUser.id;
    await this.openUserProfileService.updateUserId(currentUserId!)
    this.openCloseDialogService.open('userProfile');
  }

}