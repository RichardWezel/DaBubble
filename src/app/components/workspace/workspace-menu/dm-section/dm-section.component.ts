import { Component, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';
import { SetMobileViewService, CurrentView } from '../../../../shared/services/set-mobile-view.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dm-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './dm-section.component.html',
  styleUrl: './dm-section.component.scss'
})
export class DmSectionComponent {
  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  cloud = inject(CloudStorageService);
  isLargeScreen: boolean = false;
  isListVisible: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(private viewService: SetMobileViewService) {}

  ngOnInit(): void {
    
    // Subscription für isLargeScreen
    const screenSub = this.viewService.isLargeScreen$.subscribe(isLarge => {
      this.isLargeScreen = isLarge;
    });
    this.subscriptions.add(screenSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  currentUserIndex() {
    return this.storage.user.findIndex(user => user.id === this.storage.currentUser.id);
  }

  dmIndex(dm: { contact: string, id: string, posts: any[] }) {
    let name = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.name;
    if (dm.contact === this.storage.currentUser.id) return name + ' (Du)';
    else return name;
  }

  getDmAvatar(dm: { contact: string, id: string, posts: any[] }) {
    let avatar = this.findAvatar(dm.contact).startsWith('profile-') ? 'assets/img/profile-pictures/' + this.findAvatar(dm.contact) : this.cloud.openImage(this.findAvatar(dm.contact));
    // let avatar: string = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.avatar;
    // avatar = avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + avatar : this.cloud.openImage(avatar);
    return avatar;
  }


  findAvatar(user: string) {
    let avatar = this.storage.user.find(u => u.id === user)?.avatar;
    if (avatar) return avatar;
    else return '';
  }

  // Methode zum Umschalten des Status
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }

  goToSignIn() {
    this.navigationService.navigateTo('/signin');
  }

  handleClick(dmId: string) {
    this.navigationService.setChannel(dmId)
    if (!this.isLargeScreen) {
      this.setView('channel')
    }
  }
  
  // Methode zum Wechseln der Ansicht über den Service
  setView(view: CurrentView): void {
    this.viewService.setCurrentView(view);
  }
}
