import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
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
  successMessage: string = ''; // Success message (HERE ADDED)
  passwordVisible: boolean = false;

  @Output() generateAccount = new EventEmitter<boolean>();



  checkForm() {
    try {
      this.checkIfMailAlreadyExisting();
    } catch (e) {
      

    } finally {
      this.goToChooseAvatar();
    }


  }

  checkIfMailAlreadyExisting() {

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
}
