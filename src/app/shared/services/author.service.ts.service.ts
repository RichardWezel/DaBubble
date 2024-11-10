// src/app/services/author.service.ts

import { Injectable } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthorService {

  constructor(private firebaseService: FirebaseStorageService) { }

  /**
   * Gibt den Namen des Autors basierend auf der authorId zurück.
   * @param authorId Die Dokumenten-ID des Autors.
   * @returns Ein Observable, das den Namen des Autors enthält.
   */
  getAuthorNameById(authorId: string): Observable<string> {
    // Zugriff auf die Benutzerliste aus dem FirebaseStorageService
    const user = this.firebaseService.user.find(user => user.id === authorId);
    if (user) {
      return of(user.name);
    } else {
      // Optional: Fallback-Mechanismus, falls der Benutzer noch nicht geladen wurde
      // Hier kannst du auch eine Echtzeit-Abfrage an Firestore durchführen
      return of('Unbekannter Autor');
    }
  }
}
