import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenUserProfileService {

  private isOpenSource = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSource.asObservable();

  private userIDSource = new BehaviorSubject<string>('');
  userID$ = this.userIDSource.asObservable();

  updateToggle(value: boolean) {
    this.isOpenSource.next(value);
  }

  updateUserId(user: string) {
    this.userIDSource.next(user);
    console.log('OpenUserProfileService: userName: ', this.userID$)
  }

  constructor() { }
}
