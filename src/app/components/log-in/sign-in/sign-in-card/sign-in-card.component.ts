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
  @Output() generateAccount = new EventEmitter<boolean>();

  isLoading: boolean = false; // Ladezustand
  errorMessage: string = '';  // Fehlermeldung
  
  /**
   * Erstellt ein Konto, sendet eine Bestätigungs-E-Mail und speichert die Benutzerdaten in Firestore.
   */
  async goToChooseAvatar() {
    console.log('goToChooseAvatar wurde aufgerufen');
    this.generateAccount.emit(false);
  }

  async goToGenerateAccount() {
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

      // Firestore-Dokument erstellen
      await this.firebaseStorageService.addUser(uid, {
        name: this.signInService.signInData.name,
        email: this.signInService.signInData.email,
        avatar: this.signInService.signInData.img,
      });

      // Benutzer zur Avatar-Auswahl navigieren
      this.generateAccount.emit(false);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kontos:', error);
      this.errorMessage = 'Fehler: ' + (error as any).message;
    } finally {
      this.isLoading = false;
    }
  }

}
