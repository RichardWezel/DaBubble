// src/app/shared/services/validator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ValidatorService {
  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  validateEmail(email: string): boolean {
    return this.emailRegex.test(email);
  }

  validatePassword(password: string): boolean {
    return this.passwordRegex.test(password);
  }
}
