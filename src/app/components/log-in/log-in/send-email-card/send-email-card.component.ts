// src/app/components/log-in/log-in/send-email-card/send-email-card.component.ts
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { ViewContainerRef, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '../../../../shared/services/dialog-service';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { ValidatorService } from '../../../../shared/services/validator-service';
import { BackgroundComponent } from "../../../../shared/components/log-in/background/background.component";


@Component({
  selector: 'app-send-email-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './send-email-card.component.html',
  styleUrl: './send-email-card.component.scss',
})
export class SendEmailCardComponent {
  mailData: string = '';
  showDialog: boolean = false;
  @Output() login = new EventEmitter<boolean>();

  private dialogService = inject(DialogService);
  private validator = inject(ValidatorService);
  private viewContainerRef = inject(ViewContainerRef);
  private injector = inject(EnvironmentInjector);
  private router = inject(Router);
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
    this.login.emit(false);
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
  closeDialog() {
    this.showDialog = false;
    this.router.navigate(['/login']);
  }

}
