import { Component, inject } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-dm-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './dm-section.component.html',
  styleUrl: './dm-section.component.scss'
})
export class DmSectionComponent {
  storage = inject(FirebaseStorageService);

  constructor(private navigationService: NavigationService) { }

  // Statusvariable zur Steuerung der Sichtbarkeit
  isListVisible: boolean = true;


  currentUserIndex() {
    return this.storage.user.findIndex(user => user.id === this.storage.currentUser.id);
  }

  dmIndex(dm: { contact: string, id: string, posts: any[] }) {
    let name = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.name;
    if (dm.contact === this.storage.currentUser.id) return name + ' (Du)';
    else return name;
  }

  getDmAvatar(dm: { contact: string, id: string, posts: any[] }) {
    let avatar = this.storage.user[this.storage.user.findIndex(user => user.id === dm.contact)]?.avatar;
    avatar = avatar.startsWith('profile-') ? 'assets/img/profile-pictures/' + avatar : this.storage.openImage(avatar);
    return avatar;
  }

  // Methode zum Umschalten des Status
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }

  goToSignIn() {
    this.navigationService.navigateTo('/signin');
  }
}
