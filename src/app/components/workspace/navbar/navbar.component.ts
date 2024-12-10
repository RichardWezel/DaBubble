import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { SearchComponent } from "./search/search.component";
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { FirebaseAuthService } from '../../../shared/services/firebase-auth.service';
import { CloudStorageService } from '../../../shared/services/cloud-storage.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SearchComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  cloud = inject(CloudStorageService);


  dropDownOpen: boolean = false;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

}
