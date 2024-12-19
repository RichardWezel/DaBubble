import { Component, HostListener, ElementRef, inject, } from '@angular/core';
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';
import { SettingsComponent } from "./settings/settings.component";
import { SearchComponent } from '../navbar/search/search.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SettingsComponent, SearchComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);

  currentUserName: string = '';
  dropDownOpen: boolean = false;


  constructor() { }


  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

}