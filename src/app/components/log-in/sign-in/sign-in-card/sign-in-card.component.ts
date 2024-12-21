import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './sign-in-card.component.html',
  styleUrl: './sign-in-card.component.scss'
})
export class SignInCardComponent {
  signInService: SignInService = inject(SignInService);
  navigationService: NavigationService = inject(NavigationService);
  firebaseStorageService: FirebaseStorageService = inject(FirebaseStorageService);

  isLoading: boolean = false; // Loading level
  errorMessage: string = '';  // Error message
  successMessage: string = ''; // Success message (HIER HINZUGEFÜGT)
  passwordVisible: boolean = false;

  @Output() generateAccount = new EventEmitter<boolean>();


  /**
   * Resets the signInData when the user gets back to the login.
   * Otherwise the data stays for a better UX.
   */
  resetSignInData() {
    this.signInService.signInData = {
      name: "",
      email: "",
      password: "",
      checkboxChecked: false,
      img: ""
    }
  }

  /**
   * Navigates the user to the choose avatar card.
   */
  goToChooseAvatar() {
    console.log('goToChooseAvatar wurde aufgerufen');
    this.generateAccount.emit(false);
  }


  /**
   * When you click on the lock image you can show or hide the password.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

/*   async goToGenerateAccount() {
    const auth = getAuth();
    this.isLoading = true;
    this.errorMessage = '';

    // Sicherheitsüberprüfung
    if (!this.signInService.signInData.name || !this.signInService.signInData.email || !this.signInService.signInData.password) {
      this.errorMessage = 'Bitte füllen Sie alle erforderlichen Felder aus.';
      this.isLoading = false;
      return;
    }

    try {
      // Benutzer erstellen
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        this.signInService.signInData.email,
        this.signInService.signInData.password
      );
      const uid = userCredential.user.uid;

      // Bestätigungs-E-Mail senden
      await sendEmailVerification(userCredential.user);
      this.successMessage = `Eine Bestätigungs-E-Mail wurde an ${this.signInService.signInData.email} gesendet. Bitte überprüfen Sie Ihren Posteingang.`;

      // Warte auf Verifizierung
      const interval = setInterval(async () => {
        await auth.currentUser?.reload(); // Aktualisiere Benutzerinformationen
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval); // Stoppe den Überprüfungs-Loop

          // Benutzer zu Firestore hinzufügen
          await this.firebaseStorageService.addUser(uid, {
            name: this.signInService.signInData.name,
            email: this.signInService.signInData.email,
            avatar: this.signInService.signInData.img,
          });

          // Benutzer zur Avatar-Auswahl navigieren
          this.generateAccount.emit(false);
        }
      }, 3000); // Überprüfe alle 3 Sekunden
    } catch (error) {
      console.error('Fehler beim Erstellen des Kontos:', error);
      this.errorMessage = 'Fehler: ' + (error as any).message;
    } finally {
      this.isLoading = false;
    }
  } */


}
