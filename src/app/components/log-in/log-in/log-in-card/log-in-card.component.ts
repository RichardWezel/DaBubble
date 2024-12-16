import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { sendPasswordResetEmail, signInWithEmailAndPassword, User, UserCredential } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
// import { Firestore, doc } from '@angular/fire/firestore';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
// import { PostInterface } from '../../../../shared/interfaces/post.interface';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { Firestore } from '@angular/fire/firestore';
import { UserInterface } from '../../../../shared/interfaces/user.interface';
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
  private firestore = inject(Firestore);
  protected storage = inject(FirebaseStorageService);
  navigationService: NavigationService = inject(NavigationService);
  authService = inject(FirebaseAuthService);
  loginData: { email: string; password: string } = {
    email: '',
    password: '',
  };
  passwordVisible: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  // @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Output() login = new EventEmitter<boolean>();
  // @Output() newAccount = new EventEmitter<boolean>();


  /**
   * Shows the send-email-card to insert the mail for resetting the password.
   */
  goToSendMail() {
    this.login.emit(false);
    this.router.navigate(['/sendemail']);
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
    this.errorMessage = ''; // Reset error messagee
    signInWithEmailAndPassword(this.auth, this.loginData.email, this.loginData.password)
      .then(async (userCredential) => {
        await this.loginAsUser(userCredential);
      })
      .catch((error) => {
        this.showCorrectErrorMessage(error);
      });
  }


  /**
   * Validates wheter the login form is correctly filled out.
   * If the form is invalid, the method stops further execution.
   * @param ngForm - The Angular form object to validate.
   * @returns - No return value; exits if the form is invalid.
   */
  checkIfFormValid(ngForm: NgForm): void {
    if (ngForm.invalid) {
      // this.errorMessage = "Bitte füllen Sie alle Felder korrekt aus.";
      return;
    }
  }


  async loginAsUser(userCredential: UserCredential): Promise<void> {
    const user = userCredential.user;
    // Überprüfen, ob die E-Mail-Adresse verifiziert ist
    if (!user.emailVerified) {
      this.errorMessage = "Ihre E-Mail-Adresse ist noch nicht verifiziert. Bitte überprüfen Sie Ihren Posteingang.";
      return; // Stoppt die weitere Verarbeitung
    }
    console.log("Benutzer eingeloggt:", user);
    // Saving the Auth-UID
    sessionStorage.setItem("authUid", user.uid);
    this.storage.authUid = user.uid;
    // Loading the user information
    this.authService.getCurrentUser();
    this.storage.getCurrentUserChannelCollection();
    console.log("Benutzerkanäle geladen:", this.storage.CurrentUserChannel);
    // Set user status to "online"
    await this.authService.setCurrentUserOnline(user.uid);
    this.router.navigate(['/workspace']);
  }


  /**
   * Displays the appropriate error message based on the Firebase error.
   * @param error - The Firebase error object containing details about the login failure.
   */
  showCorrectErrorMessage(error: FirebaseError) {
    console.log('Error code', error.code);
    switch (error.code) {
      case 'auth/invalid-credential':
        this.errorMessage = "E-Mail-Adresse oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingabe.";
        break;
      default:
        this.errorMessage = "Es gibt kein Konto mit dieser E-Mail-Adresse. Bitte registrieren Sie sich zuerst.";
    }
  }


  getGoogleLoginErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return 'Das Anmelde-Popup wurde geschlossen, bevor die Anmeldung abgeschlossen werden konnte.';
      case 'auth/network-request-failed':
        return 'Netzwerkproblem! Bitte überprüfe deine Internetverbindung.';
      default:
        return 'Fehler bei der Anmeldung mit Google. Bitte versuche es später erneut.';
    }
  }


  resetPassword() {
    if (!this.loginData.email) {
      alert('Bitte geben Sie Ihre E-Mail-Adresse ein, um das Passwort zurückzusetzen.');
      return;
    }
    sendPasswordResetEmail(this.auth, this.loginData.email)
      .then(() => {
        alert('Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet.');
        this.router.navigate(['/resetpassword']); // Navigiert zur Reset-Password-Komponente
      })
      .catch((error) => {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        alert('Es gab ein Problem beim Zurücksetzen des Passworts. Bitte überprüfe deine Eingaben.');
      });
  }


  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

}
