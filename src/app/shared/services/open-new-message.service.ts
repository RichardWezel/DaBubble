import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenNewMessageService {

  private newMessageSource = new Subject<void>();
  newMessage$ = this.newMessageSource.asObservable();

  triggerNewMessage() {
    this.newMessageSource.next();
  }

  constructor() { }
}
