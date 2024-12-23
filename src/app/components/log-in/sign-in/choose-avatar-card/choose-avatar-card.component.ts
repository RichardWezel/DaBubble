import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { Auth, createUserWithEmailAndPassword, getAuth, sendEmailVerification, User, UserCredential } from '@angular/fire/auth';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { EmailSentDialogComponent } from '../../log-in/send-email-card/email-sent-dialog/email-sent-dialog.component';
import { CloudStorageService } from '../../../../shared/services/cloud-storage.service';


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
  cloud: CloudStorageService = inject(CloudStorageService);
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
  uploadFile: File | null = null;


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
      reader.onload = () => this.chosePicture(reader.result as string);
      reader.readAsDataURL(file);
      this.uploadFile = file;
    }
  }


  /**
   * Adds a new user in the Firebase Authentication.
   * A new user gets crated in the Firestore Database with the auth data.
   */
  async setNewUser(): Promise<void> {
    const auth = getAuth();
    this.resetVariables();
  
    if (this.inputFieldsNotFilledIn()) {
      this.errorMessage = 'Bitte füllen Sie alle erforderlichen Felder aus.';
      return;
    }
  
    // Handle user creation and verification email
    const userCreatedSuccessfully = await this.createUserAndSendVerification(auth);
    if (!userCreatedSuccessfully) {
      return; // Abort further execution if user creation or email failed
    }
  
    // If everything is successful, show the dialog
    this.showSuccessDialog();
  }


  /**
   * The email-send-dialog gets closed and the user gets navigated to the login.
   */
  handleDialogClose() {
    this.showDialog = false;
    this.navigationService.navigateTo('/login');
  }


  /**
   * Resets the state variables to their default values.
   */
  resetVariables() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
  }


  /**
   * Checks if all input fields are filled in.
   * @returns - Returns true if any input fields are emtpy; otherwise, false.
   */
  inputFieldsNotFilledIn(): boolean {
    return !this.signInService.signInData.name || !this.signInService.signInData.email || !this.signInService.signInData.password;
  }


  /**
   * Handles the creation of a new user in the authentication as well as in the userCollection.
   * Handles the upload of the profile picture.
   * @param auth - The Firebase authentication object.
   * @returns - Returns true if everything is successful, otherwise false.
   */
  async createUserAndSendVerification(auth: Auth): Promise<boolean> {
    try {
      const userCredential = await this.createFirebaseAuthenticationUser(auth);
      const uid = userCredential.user.uid;
  
      await this.handleProfilePictureUpload(uid);
  
      await this.addNewUserToUserCollection(uid);
  
      const emailSent = await this.sendVerificationEmail(userCredential.user);
      if (!emailSent) return false; // Abort if email failed to send
  
      return true; // Return true if everything succeeded
    } catch (error) {
      this.errorMessage = 'Fehler beim Erstellen des Kontos.';
      return false; // Return false if something failed
    }
  }


  /**
   * The dialog that a verification email is sent, gets shown.
   */
  showSuccessDialog() {
    this.showDialog = true;
    this.isLoading = false;
  }


  /**
   * Creates a Firebase authentication user using email and password.
   * @param auth - The Firebase authentication object.
   * @returns - The user credential object returned by Firebase.
   */
  async createFirebaseAuthenticationUser(auth: Auth): Promise<UserCredential> {
    return await createUserWithEmailAndPassword(
      auth,
      this.signInService.signInData.email,
      this.signInService.signInData.password
    );
  }


  /**
   * Handles uploading the profile picture if a file is provided.
   * @param uid - The authenticated user's UID.
   */
  async handleProfilePictureUpload(uid: string): Promise<void> {
    if (this.uploadFile) {
      this.signInService.signInData.img = await this.cloud.uploadProfilePicture(uid, this.uploadFile);
      this.uploadFile = null;
    }
  }


  /**
   * Adds a new user to the Firestore "user" collection.
   * @param uid - The authenticated user's UID.
   */
  async addNewUserToUserCollection(uid: string): Promise<void> {
    await this.storage.addUser(uid, {
      name: this.signInService.signInData.name,
      email: this.signInService.signInData.email,
      avatar: this.signInService.signInData.img,
    });
  }


  /**
   * Sends a verification email to the proviced user.
   * @param user - The user object to whom the verification email should be sent.
   * @returns - Returns true if the email was sent successfully, otherwise false.
   */
  async sendVerificationEmail(user: User): Promise<boolean> {
    try {
      await sendEmailVerification(user);
      return true;
    } catch (emailError) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
      this.errorMessage = 'Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.';
      return false;
    }
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
    this.signInService.resetSignInData();
  }


  /**
   * Routes the user to the login component.
   */
  goBackToLogin() {
    this.navigationService.navigateTo('login');
  }
}
