import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UidService {

  constructor() { }


  /**
   * Generates a unique identifier using UUID version 4.
   * 
   * @returns {string} A unique identifier string.
   */
  generateUid(): string {
    return uuidv4();
  }
}