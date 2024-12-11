// src/app/components/log-in/reset-password/reset-password-card/reset-password-card.component.ts
import { Component, EnvironmentInjector, EventEmitter, inject, OnInit, Output, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmPasswordReset, getAuth, sendEmailVerification, signInWithEmailAndPassword, verifyPasswordResetCode } from '@angular/fire/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordChangedDialogComponent } from '../password-changed-dialog/password-changed-dialog.component';
import { DialogService } from '../../../../shared/services/dialog-service.service';
import { ValidatorService } from '../../../../shared/services/validator-service.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { EmailVerifiedComponent } from '../../sign-in/email-verified/email-verified.component';

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss',
})
export class ResetPasswordCardComponent implements OnInit {
  storage = inject(FirebaseStorageService);
  authService = inject(FirebaseAuthService);
  navigationService: NavigationService = inject(NavigationService);
  route = inject(ActivatedRoute);
  auth = getAuth();
  private dialogService = inject(DialogService);
  private validator = inject(ValidatorService);
  private viewContainerRef = inject(ViewContainerRef);
  private injector = inject(EnvironmentInjector);
  private router = inject(Router);

  @Output() login = new EventEmitter<boolean>();

  passwordVisible = false;
  mailData: string = '';
  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;
  oobCode: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor() {
    console.log('Current User:', this.storage.currentUser);
    console.log('Auth UID:', this.storage.authUid);
  }

  

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      console.log('oobCode received:', this.oobCode); // Debugging
      if (!this.oobCode) {
        this.errorMessage = 'Ungültiger oder abgelaufener Link.';
        this.isLoading = false;
        return;
      }

      verifyPasswordResetCode(this.auth, this.oobCode)
        .then(() => {
          console.log('oobCode verified successfully'); // Debugging
          this.isLoading = false;
        })
        .catch((error) => {
          console.error('Verification error:', error); // Debugging
          this.errorMessage = 'Ungültiger oder abgelaufener Link.';
          this.isLoading = false;
        });
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }


  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }

  resetPassword() {
    if (!this.oobCode) {
      this.errorMessage = 'Kein gültiger Reset-Code gefunden.';
      return;
    }
    if (!this.validator.validatePassword(this.passwordData)) {
      this.errorMessage = 'Das Passwort erfüllt nicht die Anforderungen.';
      return;
    }
    this.isLoading = true;
    confirmPasswordReset(this.auth, this.oobCode, this.passwordData)
      .then(() => {
        this.isLoading = false;
        this.dialogService.openDialog(PasswordChangedDialogComponent, this.viewContainerRef, this.injector, 3000, '/login', this.router);
      })
      .catch((err) => {
        this.isLoading = false;
        this.errorMessage = err.code === 'auth/invalid-action-code'
          ? 'Der Link ist ungültig oder abgelaufen.'
          : 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
        console.error('Passwort-Reset-Fehler:', err);
      });
  }
}
