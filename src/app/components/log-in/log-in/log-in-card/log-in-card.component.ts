import { Component, EventEmitter, Output, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { signInWithEmailAndPassword, User, UserCredential } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { FirebaseError } from '@angular/fire/app';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [FormsModule, CardComponent, CommonModule],
  templateUrl: './log-in-card.component.html',
  styleUrls: ['./log-in-card.component.scss']
})
export class LogInCardComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  protected storage = inject(FirebaseStorageService);
  navigationService: NavigationService = inject(NavigationService);
  authService = inject(FirebaseAuthService);
  loginData: { email: string; password: string } = {
    email: '',
    password: '',
  };
  passwordVisible: boolean = false;
  /**
   * Which sign-in is currently waiting on the network, if any.
   *
   * Every sign-in loads the user document, the channels and the conversations
   * before it can show the workspace - on a phone long enough that an
   * unmarked button looks broken. Tracking which one is running lets the
   * button that was tapped say so, while the others only grey out.
   */
  busy: '' | 'email' | 'google' | 'guest' = '';
  mailInputIsFocused: boolean = false;
  passwordInputIsFocused: boolean = false;
  inputFieldCheck: boolean = false;

  @Output() login = new EventEmitter<boolean>();

  constructor() { }


  /**
   * Shows the send-email-card to insert the mail for resetting the password.
   */
  goToSendMail() {
    this.authService.errorMessage = '';
    this.login.emit(false);
  }


  /**
   * When you click on the lock image you can show or hide the password.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }


  /**
   * Attempts to log in the user using the provided login form.
   * If the login is successful, the user is logged in; otherwise, an appropriate error message is displayed.
   * @param ngForm - The Angular form object to validate.
   */
  checkLogin(ngForm: NgForm) {
    this.checkIfFormValid(ngForm);
    if (ngForm.invalid) return;
    this.authService.errorMessage = ''; // Reset error messagee
    this.busy = 'email';
    signInWithEmailAndPassword(this.auth, this.loginData.email, this.loginData.password)
      .then(async (userCredential) => {
        await this.loginAsUser(userCredential);
      })
      .catch((error) => {
        this.showCorrectErrorMessage(error);
      })
      .finally(() => {
        this.busy = '';
      });
  }


  /**
   * Signs in as the demo guest.
   *
   * Everything the workspace needs is loaded before it navigates, so on a
   * slow connection there are a few seconds between the tap and the screen
   * changing - hence the busy state.
   */
  async loginAsGuest(): Promise<void> {
    this.busy = 'guest';
    try {
      await this.authService.guestLogin();
    } finally {
      this.busy = '';
    }
  }


  /**
   * Signs in with Google. Busy state as above.
   */
  async loginWithGoogle(): Promise<void> {
    this.busy = 'google';
    try {
      await this.authService.googleLogin();
    } finally {
      this.busy = '';
    }
  }


  /**
   * Validates wheter the login form is correctly filled out.
   * If the form is invalid, the method stops further execution.
   * @param ngForm - The Angular form object to validate.
   * @returns - No return value; exits if the form is invalid.
   */
  checkIfFormValid(ngForm: NgForm): void {
    if (ngForm.invalid) {
      this.authService.errorMessage = "Bitte füllen Sie alle Felder korrekt aus.";
      return;
    }
  }


  /**
   * Logs in a user using the provided credentials from the Firebase Authentication.
   * For that it performs following tasks:
   * - Verifies that the user's email address is confirmed.
   * - Saves the user's UID to session storage and updates the authUid in the Firebase Storage Service.
   * - Loads the user information from the according user document.
   * - Sets the user status as "online".
   * - Navigates the user to the workspace page after successful login.
   * @param userCredential - The user credential object containing the authenticated user's data.
   * @returns - A primice that resolves once the user is logged in. If the email is not verifeid, the process stops.
   */
  async loginAsUser(userCredential: UserCredential): Promise<void> {
    const user = userCredential.user;
    if (!user.emailVerified) {
      this.authService.errorMessage = "Ihre E-Mail-Adresse ist noch nicht verifiziert. Überprüfen Sie Ihren Posteingang.";
      return; // Stops further execution
    }
    this.savingAuthUid(user);
    // Same as the guest login: the workspace's loader covers the wait, the
    // login screen cannot.
    this.storage.doneLoading = false;
    this.navigateToWorkspace();
    await this.authService.getCurrentUser();
  }


  /**
   * Saves the uid from the userCredential user in the session storage.
   * Updates the authUid in Firebase storage service with the uid of the userCredential user.
   * @param user - A Firebase 'User' object, which represents the currently authenticated user.
   */
  savingAuthUid(user: User) {
    sessionStorage.setItem("authUid", user.uid);
    this.storage.authUid = user.uid;
  }


  /**
   * Navigates to the workspace.
   */
  navigateToWorkspace() {
    this.router.navigate(['/workspace']);
  }


  /**
   * Displays the appropriate error message based on the Firebase error.
   * @param error - The Firebase error object containing details about the login failure.
   */
  showCorrectErrorMessage(error: FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
        this.authService.errorMessage = "E-Mail-Adresse oder Passwort ist falsch. Überprüfen Sie Ihre Eingabe.";
        break;
      default:
        this.authService.errorMessage = "Es gibt kein Konto mit dieser E-Mail-Adresse. Registrieren Sie sich zuerst.";
    }
  }


  /**
   * Checks if the input fields are valid by setting the focus of the input fields to true.
   */
  checkInputFields() {
    this.authService.errorMessage = '';
    this.inputFieldCheck = true;
  }
}
