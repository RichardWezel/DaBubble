import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from "./search/search.component";
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';

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
  router = inject(Router);
  

  caretSrc: string = 'assets/icons/user-caret.svg';
  dropDownOpen: boolean = false;

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.querySelector('.current-user').contains(event.target)) {
      this.dropDownOpen = false;
    }
  }

  logout() {
    this.router.navigate(['/login']); 
  }
}
