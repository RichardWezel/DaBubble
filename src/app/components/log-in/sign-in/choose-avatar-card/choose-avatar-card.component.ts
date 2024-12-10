import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { Auth, createUserWithEmailAndPassword, getAuth, sendEmailVerification } from '@angular/fire/auth';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { EmailSentDialogComponent } from '../../log-in/send-email-card/email-sent-dialog/email-sent-dialog.component';


@Component({
  selector: 'app-choose-avatar-card',
  standalone: true,
  imports: [CardComponent, CommonModule, FormsModule, EmailSentDialogComponent],
  templateUrl: './choose-avatar-card.component.html',
  styleUrl: './choose-avatar-card.component.scss'
})
export class ChooseAvatarCardComponent {
  pictures = ['assets/img/profile-pictures/profile-1.png', 'assets/img/profile-pictures/profile-2.png', 'assets/img/profile-pictures/profile-3.png', 'assets/img/profile-pictures/profile-4.png', 'assets/img/profile-pictures/profile-5.png', 'assets/img/profile-pictures/profile-6.png'];
  signInService: SignInService = inject(SignInService);
  currentProfilePicture = this.signInService.signInData.img || 'assets/img/profile-basic.png';
  avatarSelected = this.signInService.signInData.img != '';
  storage: FirebaseStorageService = inject(FirebaseStorageService);
  private auth: Auth = inject(Auth);
  navigationService: NavigationService = inject(NavigationService);
  @Output() generateAccount = new EventEmitter<boolean>();

  isLoading: boolean = false; // Ladezustand
  errorMessage: string = '';  // Fehlermeldung
  successMessage: string = ''; // Erfolgsmeldung
  showDialog: boolean = false; // Dialog-Steuerung
  /**
   * This method navigates back to the sign-in-card component.
   * For that, it emits an event to the sign-in component.
   */
  goToGenerateAccount() {
    this.generateAccount.emit(true);
  }


  /**
   * The chosen picture from the selection gets saved as the currentProfilePicture and in the signInService.
   * @param path 
   */
  chosePicture(path: string) {
    this.currentProfilePicture = path;
    this.avatarSelected = true;
    this.signInService.signInData.img = path;
  }


  /**
   * Triggers a click event on the provided file input element to open the file explorer.
   * @param fileInput 
   */
  openFileExplorer(fileInput: HTMLInputElement) {
    fileInput.click();
  }


  /**
   * This method selects a picture from the file explorer.
   * @param event - The file input change event that contains the selected file.
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          this.currentProfilePicture = reader.result as string;
          this.signInService.signInData.img = reader.result as string;
          this.avatarSelected = true;
        }
      };

      reader.onerror = () => {
        console.error('Fehler beim Lesen der Datei');
      };

      reader.readAsDataURL(file);
    }
  }


  /**
   * Adds a new user in the Firebase Authentication and saves the uid from the authentication as authUid.
   * A new user gets crated in the Firestore Database with the authUid and the insereted user data.
   * When the authentication and the new user are created the signinData gets cleared and the user gets routed to the login.
   */
  async setNewUser(): Promise<void> {
    const auth = getAuth();
    this.isLoading = true; // Ladezustand aktivieren
    this.errorMessage = ''; // Fehler zurücksetzen
    this.successMessage = ''; // Erfolgsmeldung zurücksetzen

    // Sicherheitsüberprüfung: Sind alle Felder ausgefüllt?
    if (!this.signInService.signInData.name || !this.signInService.signInData.email || !this.signInService.signInData.password) {
      this.errorMessage = 'Bitte füllen Sie alle erforderlichen Felder aus.';
      this.isLoading = false;
      return;
    }

    try {
      // Firebase-Benutzer erstellen
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        this.signInService.signInData.email,
        this.signInService.signInData.password
      );
      const uid = userCredential.user.uid;

      await this.storage.addUser(uid, {
        name: this.signInService.signInData.name,
        email: this.signInService.signInData.email,
        avatar: this.signInService.signInData.img,
      });

      // Bestätigungs-E-Mail senden
      try {
        await sendEmailVerification(userCredential.user);
      } catch (emailError) {
        console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
        this.errorMessage = 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.';
        return; // Abbrechen, wenn die E-Mail nicht gesendet werden konnte
      }

      // Dialog anzeigen
      this.showDialog = true;

    } catch (error) {
      console.error('Fehler beim Erstellen des Kontos:', error);
      this.errorMessage = 'Fehler: ' + (error as any).message;
    } finally {
      this.isLoading = false; // Ladezustand deaktivieren
    }
  }

  handleDialogClose() {
    this.showDialog = false; // Dialog schließen
    this.navigationService.navigateTo('/login'); // Weiterleitung zur Login-Seite
  }

  /**
   * This method creates a new user in the authentication from Firebase with the inserted email and password.
   * The user uid gets returned as authUid to create a new user document with this id.
   * If the email address already exists, the user gets routed back to the sign-in-card and the data gets cleared.
   * @returns - AuthUid to create the id for a new user document.
   */
  async setUserInFirebaseAuthentication(): Promise<any> {
    const auth = getAuth();
    const email = this.signInService.signInData.email;
    const password = this.signInService.signInData.password;
    console.log('img', this.signInService.signInData.img);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user.uid;
    } catch {
      alert("Mit dieser E-Mail Adresse existiert bereits ein Benutzer.");
      this.goToGenerateAccount();
      this.clearSignInServiceData();
      return undefined; // Explicitly return undefined on failure
    }
  }


  /**
   * Returns the name, email and avatar from the signInData from the signInService to create a new user document.
   * @returns - An object with the insereted name, email and selected avatar.
   */
  getSignInData(): any {
    return {
      name: this.signInService.signInData.name,
      email: this.signInService.signInData.email,
      avatar: this.signInService.signInData.img,
    }
  }


  /**
   * Clears the variables in the signInData object.
   */
  clearSignInServiceData(): void {
    this.signInService.signInData = {
      name: "",
      email: "",
      password: "",
      checkboxChecked: false,
      img: ""
    };
  }

  async confirmAvatarSelection() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Benutzer ist nicht eingeloggt.');
      }

      // Bestätigungs-E-Mail senden
      await sendEmailVerification(user);

      // Erfolgsmeldung anzeigen
      this.successMessage = `Eine Bestätigungs-E-Mail wurde an ${user.email} gesendet. Bitte überprüfen Sie Ihren Posteingang.`;

      // Optional: Weiterleitung oder andere Aktionen
      console.log('Avatar-Auswahl abgeschlossen und Bestätigungs-E-Mail gesendet.');
    } catch (error) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', error);
      this.errorMessage = 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.';
    }
  }

  /**
   * Routes the user to the login component.
   */
  goBackToLogin() {
    this.navigationService.navigateTo('login');
  }
}
