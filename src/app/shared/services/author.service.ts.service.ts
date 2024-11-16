// src/app/services/author.service.ts

import { Injectable } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { Observable, of } from 'rxjs';
import { UserInterface } from '../interfaces/user.interface';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInWithRedirect } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  signInWithPopup(provider: GoogleAuthProvider) {
    throw new Error('Method not implemented.');
  }

  constructor(private firebaseService: FirebaseStorageService, private auth: Auth) { }

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
      return of({ name: 'Unbekannter Autor', id: authorId, avatar: '', email: '', online: false, dm: [] });
    }
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(this.auth, provider); 
      console.log('User signed in');
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);  
      console.log('User signed out');
      
    } catch (error) {
      console.error('Error during sign-out:', error);
      
    }
  }
}
