import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenUserProfileService {

  private isOpenSource = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSource.asObservable();

  private userNameSource = new BehaviorSubject<string>('');
  userName$ = this.userNameSource.asObservable();

  updateToggle(value: boolean) {
    this.isOpenSource.next(value);
  }

  updateUserId(name: string) {
    this.userNameSource.next(name);
  }

  constructor() { }
}
