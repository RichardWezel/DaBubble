// src/app/services/author.service.ts

import { Injectable } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { Observable, of } from 'rxjs';
import { UserInterface } from '../interfaces/user.interface';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';   
import { User } from 'firebase/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthorService {
 
  constructor(private firebaseService: FirebaseStorageService, private auth: Auth, private firestore: Firestore) { }

  /**
   * Gibt den Namen des Autors basierend auf der authorId zurück.
   * @param authorId Die Dokumenten-ID des Autors.
   * @returns Ein Observable, das den Namen des Autors enthält.
   */
  getAuthorNameById(authorId: string): Observable<UserInterface> {
    // Zugriff auf die Benutzerliste aus dem FirebaseStorageService
    const user = this.firebaseService.user.find(user => user.id === authorId);
    if (user) {
      return of(user);
    } else {
      // Optional: Fallback-Mechanismus, falls der Benutzer noch nicht geladen wurde
      // Hier kannst du auch eine Echtzeit-Abfrage an Firestore durchführen
      return of({ type: 'user', name: 'Unbekannter Autor', id: authorId, avatar: '', email: '', online: false, dm: [] });
    }
  }
}
