import { Injectable, inject } from '@angular/core';
import { FirebaseStorageService } from './firebase-storage.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GetUserNameService {

  storage = inject(FirebaseStorageService);

  constructor() { }

  /**
   * Finds the name of the user with the given ID from the storage's user array.
   * If the user is found, their name is returned as an Observable. Otherwise, an empty string is returned.
   * @param {string} id - The ID of the user whose name is to be found.
   * @returns {Observable<string>} The name of the user if found, otherwise an empty string.
   */
  getName(userId: string): Observable<string> {
    return this.storage.users$.pipe(
      map(users => {
        const user = users.find(user => user.id === userId);
        return user ? user.name : '';
      })
    );
  }
}
