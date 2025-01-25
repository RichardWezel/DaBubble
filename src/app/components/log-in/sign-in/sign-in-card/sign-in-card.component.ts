import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';
import { CommonModule } from '@angular/common';
import { FirebaseAuthService } from '../../../../shared/services/firebase-auth.service';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';

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
  authService: FirebaseAuthService = inject(FirebaseAuthService);
  firestore: Firestore = inject(Firestore);

  isLoading: boolean = false; // Loading level
  formError: boolean = false;
  passwordVisible: boolean = false;
  inputFieldCheck: boolean = false;

  @Output() generateAccount = new EventEmitter<boolean>();


  /**
   * Verifies ifan email address already exists and performs corresponding actions.
   */
  async checkForm() {
    this.resetCheckForm();
    try {
      const emailExists = await this.checkIfEmailExists();
      if (emailExists) {
        this.showErrorMessageIfMailExists();
      } else {
        this.goToChooseAvatar();
      } 
    } catch (error) {
      this.authService.errorMessage = "Es gab ein Problem bei der Überprüfung der E-Mail-Adresse.";
    } finally {
      this.isLoading = false;
    }
  }


  /**
   * Resets the form state by initializing relevant properties.
   */
  resetCheckForm() {
    this.isLoading = true;
    this.authService.errorMessage = '';
    this.inputFieldCheck = false;
  }


  /**
   * Displays an error message indicating the email address is already in use.
   */
  showErrorMessageIfMailExists() {
    this.authService.errorMessage = "Diese E-Mail-Adresse wird bereits verwendet.";
    this.signInService.resetSignInData();
  }

  
  /**
   * Checks if an email address already exists in the Firestore "user" collection.
   * @returns - A proise that resolves to 'true' if the email exists, or 'false' if it does not.
   */
  async checkIfEmailExists(): Promise<boolean> {
    try {
      const collectionRef = collection(this.firestore, "user");
      const collectionQuery = query(collectionRef, where("email", "==", this.signInService.signInData.email));
      const querySnapshot = await getDocs(collectionQuery);
      if (!querySnapshot.empty) {
        return true;
      }
      else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }


  /**
   * Navigates the user to the choose avatar card.
   */
  goToChooseAvatar() {
    this.generateAccount.emit(false);
  }


  /**
   * When you click on the lock image you can show or hide the password.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }


  /**
   * Checks if the input fields are valid by setting the focus of the input fields to true.
   */
  checkInputFields() {
    this.authService.errorMessage = '';
    this.inputFieldCheck = true;
    console.log("Check");
  }
}
