import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { ValidatorService } from '../../../../shared/services/validator-service';
import { ConfirmationModalComponent } from "../../../../shared/components/confirmation-modal/confirmation-modal.component";


@Component({
  selector: 'app-send-email-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule, ConfirmationModalComponent],
  templateUrl: './send-email-card.component.html',
  styleUrl: './send-email-card.component.scss',
})
export class SendEmailCardComponent {
  mailData: string = '';
  showDialog: boolean = false;
  mailInputIsFocused: boolean = false;
  @Output() login = new EventEmitter<boolean>();

  private validator = inject(ValidatorService);
  private auth = inject(Auth);


  /**
   * Initializes the component an injects the rquired services.
   * @param navigationService - Service used to handle navigation within the application.
   */
  constructor(public navigationService: NavigationService) { }


  /**
   * Navigates the user to the login card.
   */
  goToLogin() {
    this.login.emit(true);
  }


  /**
   * Sends a mail with the link to reset the password if the mail matches the mail regex.
   * @returns - Resolves when the password reset email is successfully sent.
   *            If the email is invalid, it returns early with no value.
   */
  async sendMail(): Promise<void> {
    if (!this.mailData || !this.validator.validateEmail(this.mailData)) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    try {
      await sendPasswordResetEmail(this.auth, this.mailData);
      this.showDialog = true;
    } catch (error: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      alert('Es gab ein Problem beim Zurücksetzen des Passworts.');
    }
  }


  /**
   * If the confirmation dialog gets closed, the user gets navigated to the login.
   */
  closeDialog(event: boolean) {
    this.showDialog = event;
    this.login.emit(true);
  }

}
