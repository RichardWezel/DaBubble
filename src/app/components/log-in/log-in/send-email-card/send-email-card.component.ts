import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { ViewContainerRef, EnvironmentInjector } from '@angular/core';
import { EmailSentDialogComponent } from './email-sent-dialog/email-sent-dialog.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-send-email-card',
  standalone: true,
  imports: [CardComponent, FormsModule],
  templateUrl: './send-email-card.component.html',
  styleUrl: './send-email-card.component.scss'
})
export class SendEmailCardComponent {
  mailData: string = '';
  @Output() login = new EventEmitter<boolean>();
  
  private viewContainerRef = inject(ViewContainerRef); // Für dynamische Komponentenerstellung
  private injector = inject(EnvironmentInjector); // Für Dependency Injection
  private router = inject(Router);
  private auth = inject(Auth);

  goToLogin() {
    this.login.emit(true);
  }

  async sendMail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.mailData || !emailRegex.test(this.mailData)) {
      alert('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, this.mailData);
      this.showEmailSentDialog();
    } catch (error: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      alert('Es gab ein Problem beim Zurücksetzen des Passworts.');
    }
  }

  showEmailSentDialog() {
    const componentRef = this.viewContainerRef.createComponent(EmailSentDialogComponent, {
      environmentInjector: this.injector,
    });

    setTimeout(() => {
      componentRef.destroy();
      this.router.navigate(['/login']); 
    }, 3000);
  }
}
