// src/app/services/author.service.ts

import { Injectable } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { Observable, of } from 'rxjs';
import { UserInterface } from '../interfaces/user.interface';


@Injectable({
  providedIn: 'root'
})
export class AuthorService {


  constructor(private firebaseService: FirebaseStorageService) { }


  /**
   * Retrieves the author information based on the provided author ID.
   * Searches the user list from FirebaseStorageService to find a user with a matching ID.
   * If found, returns an observable of the UserInterface with the author's details.
   * If not found, returns an observable with a default user object indicating an unknown author.
   *
   * @param {string} authorId - The ID of the author to be retrieved.
   * @returns {Observable<UserInterface>} An observable containing the author's information or a default unknown author object.
   */
  getAuthorNameById(authorId: string): Observable<UserInterface> {
    const user = this.firebaseService.user.find(user => user.id === authorId);
    if (user) {
      return of(user);
    } else {
      return of({ type: 'user', name: 'Unbekannter Autor', id: authorId, avatar: '', email: '', online: false, dm: [] });
    }
  }
}
