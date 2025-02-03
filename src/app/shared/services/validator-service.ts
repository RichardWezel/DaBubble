// src/app/shared/services/validator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ValidatorService {
  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;


  /**
   * Validates the inserted email with a regex.
   * @param email - The inserted email address.
   * @returns - True, if the email address matches the regex, otherwise false.
   */
  validateEmail(email: string): boolean {
    return this.emailRegex.test(email);
  }


  /**
   * Validates the inserted password with a regex.
   * @param password - The inserted password.
   * @returns - True, if the password matches the regex, otherwise false.
   */
  validatePassword(password: string): boolean {
    return this.passwordRegex.test(password);
  }
}
