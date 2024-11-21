import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { Auth, createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-choose-avatar-card',
  standalone: true,
  imports: [CardComponent, CommonModule, FormsModule],
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
   * Adds a new user in the Firebase Authentication and gets the uid from the authentication as authUid back.
   * A new user gets crated in the Firestore Database with the authUid and the insereted user data.
   * When the authentication and the new user are created the signinData gets cleared and the user gets routed to the login.
   */
  setNewUser() {
    this.setUserInFirebaseAuthentication()
      .then((authUid) => {
        const userData = this.getSignInData();
        this.storage.addUser(authUid, userData);
        this.clearSignInServiceData();
        this.goBackToLogin();
      })
      .catch((error) => {
        throw error;
      })
  }

  
  /**
   * This method creates a new user in the authentication from Firebase with the inserted email and password.
   * The user uid gets returned as authUid to create a new user document with this id.
   * @returns - AuthUid to create the id for a new user document.
   */
  async setUserInFirebaseAuthentication(): Promise<string> {
    const auth = getAuth();
    const email = this.signInService.signInData.email;
    const password = this.signInService.signInData.password;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const authUid = userCredential.user.uid;
      return authUid;
    } catch (error ) {
      throw error;
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


  /**
   * Routes the user to the login component.
   */
  goBackToLogin() {
    this.navigationService.navigateTo('login');
  }
}
