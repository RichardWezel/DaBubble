import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CardComponent } from "../../log-in/card/card.component";
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseAuthService } from '../../../services/firebase-auth.service';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from '@angular/fire/auth';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { UserInterface } from '../../../interfaces/user.interface';
@Component({
  selector: 'app-enter-password',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './enter-password.component.html',
  styleUrl: './enter-password.component.scss'
})
export class EnterPasswordComponent {
  authService = inject(FirebaseAuthService);
  storage = inject(FirebaseStorageService);
  auth = inject(FirebaseAuthService);
  insertedPassword: string = '';
  passwordVisible: boolean = false;
  inputFieldCheck: boolean = false;
  @Input() newEmail!: string;
  @Input() userId!: string;
  @Output() abandonDialog: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() nextDialog: EventEmitter<boolean> = new EventEmitter<boolean>();
  message: string = '';

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
  }

  abandonProcess() {
    this.abandonDialog.emit(false);
  }

  async reauthenticateWithPassword() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, this.insertedPassword);
      await reauthenticateWithCredential(user, credential);
      await this.changeUserEmail(this.newEmail);
      this.handleSuccess();
    }
  }

    /**
   * Attempts to change the user's email using the authentication service.
   */
    private async changeUserEmail(newEmail: string): Promise<void> {
      await this.auth.changeUserEmail(newEmail);
    }

  /**
   * Handles successful email update by setting a success message and logging.
   */
    async handleSuccess() {
      this.nextDialog.emit(false);
            const updatedUser: Partial<UserInterface> = {
              email: this.newEmail
            };
      await this.storage.updateUser(this.userId, updatedUser as UserInterface);
    }

}
