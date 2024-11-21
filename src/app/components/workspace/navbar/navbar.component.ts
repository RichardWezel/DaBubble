import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from "./search/search.component";
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { signOut } from '@angular/fire/auth';
import { updateDoc, doc } from '@angular/fire/firestore';

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

  guestLogin() {
  this.storage.guestLogin(); // Lokale Gastdaten setzen
  this.router.navigate(['/workspace']); // Navigation zur Hauptansicht
}

  logout() {
    const user = this.storage.auth.currentUser; // Aktuellen Benutzer abrufen

    if (user) {
      const userDocRef = doc(this.storage.firestore, 'user', user.uid);

      updateDoc(userDocRef, { online: false })
        .then(() => {
          console.log(`Benutzer ${user.uid} wurde als offline markiert.`);
        })
        .catch((error) => {
          console.error(`Fehler beim Zurücksetzen des Online-Status für ${user.uid}:`, error);
        });
    }

    signOut(this.storage.auth)
      .then(() => {
        console.log('Benutzer erfolgreich abgemeldet.');

        // Lokale Benutzerdaten löschen
        this.storage.clearCurrentUser();

        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Fehler beim Abmelden:', error);
      });
  }

  
}
