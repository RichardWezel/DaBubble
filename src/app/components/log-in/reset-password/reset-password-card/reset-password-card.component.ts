import { Component, inject, OnInit } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { Auth, getAuth, confirmPasswordReset, verifyPasswordResetCode } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent implements OnInit {
  navigationService: NavigationService = inject(NavigationService);
  route = inject(ActivatedRoute);
  auth = getAuth();

  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;
  oobCode: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      if (!this.oobCode) {
        this.errorMessage = 'Ungültiger oder abgelaufener Link.';
        this.isLoading = false;
        return;
      }

      verifyPasswordResetCode(this.auth, this.oobCode)
        .then(() => {
          this.isLoading = false;
        })
        .catch(() => {
          this.errorMessage = 'Ungültiger oder abgelaufener Link.';
          this.isLoading = false;
        });
    });
  }

  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }

  resetPassword() {
    if (!this.oobCode) {
      this.errorMessage = 'Kein gültiger Reset-Code gefunden.';
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(this.passwordData)) {
      this.errorMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.';
      return;
    }
    this.isLoading = true;
    confirmPasswordReset(this.auth, this.oobCode, this.passwordData)
      .then(() => {
        this.isLoading = false;
        alert('Passwort wurde erfolgreich geändert!'); 
        this.navigationService.navigateTo('/login'); 
      })
      .catch(err => {
        this.isLoading = false;
        if (err.code === 'auth/invalid-action-code') {
          this.errorMessage = 'Der Link ist ungültig oder abgelaufen.';
        } else {
          this.errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
        }
        console.error('Passwort-Reset-Fehler:', err);
      });
  }
}
