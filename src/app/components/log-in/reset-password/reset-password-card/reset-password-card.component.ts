import { Component, EnvironmentInjector, EventEmitter, inject, OnInit, Output, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmPasswordReset, getAuth, verifyPasswordResetCode } from '@angular/fire/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordChangedDialogComponent } from '../password-changed-dialog/password-changed-dialog.component';
import { DialogService } from '../../../../shared/services/dialog-service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { ValidatorService } from '../../../../shared/services/validator-service';

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
  passwordInputIsFocused: boolean = false;
  confirmPasswordInputIsFocused: boolean = false;
  inputFieldCheck: boolean = false;


  constructor() {
  }


  /**
   * When the component is initialized the component subscribes to the query parameters from the current route.
   * Extracts the 'oobCode' from the URL and reacts accordingly.
   */
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      if (!this.oobCode) {
        this.handleLinkError();
      } else {
        this.verifyOobCode();
      }
    });
  }


  /**
   * Handles an error with a message if the link is invalid or expired.
   */
  handleLinkError() {
    this.errorMessage = 'Ungültiger oder abgelaufener Link.';
    this.isLoading = false;
  }


  /**
   * Verifies the OobCode from the activated route.
   */
  verifyOobCode() {
    verifyPasswordResetCode(this.auth, this.oobCode)
      .then(() => {
        this.isLoading = false;
      })
      .catch((error) => {
        this.handleLinkError();
      });
  }


  /**
   * Toggles the visibility of the inserted password.
   */
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }


  /**
   * Compares the inserted passwords. If the passwords aren't the same, a message is shown.
   */
  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }


  /**
   * Resets the Password when there is an OobCode and a valid password.
   */
  resetPassword() {
    if (!this.oobCode) {
      this.errorMessageNoOobCode();
    } else if (!this.validator.validatePassword(this.passwordData)) {
      this.errorMessageInvalidPassword();
    } else {
      this.tryResetPassword();
    }
  }


  /**
   * Error message when there is no OobCode.
   */
  errorMessageNoOobCode() {
    this.errorMessage = 'Kein gültiger Reset-Code gefunden.';
  }


  /**
   * Error message when the password is invalid.
   */
  errorMessageInvalidPassword() {
    this.errorMessage = 'Das Passwort erfüllt nicht die Anforderungen.';
  }


  /**
   * Attempts to reset the user's password using the provided reset code and new password.
   * If the password reset is successful, a confirmation dialog is shown.
   * If an error occurs, an appropriate error message is displayed.
   */
  tryResetPassword() {
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
      });
  }


  /**
   * Checks if the input fields are valid by setting the focus of the input fields to true.
   */
  checkInputFields() {
    this.authService.errorMessage = '';
    this.inputFieldCheck = true;
  }
}
