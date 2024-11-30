import { confirmPasswordReset, getAuth, sendEmailVerification, signInWithEmailAndPassword, verifyPasswordResetCode } from "@angular/fire/auth";
import { PasswordChangedDialogComponent } from "../password-changed-dialog/password-changed-dialog.component";
import { Component, EnvironmentInjector, EventEmitter, inject, OnInit, Output, ViewContainerRef } from "@angular/core";
import { NavigationService } from "../../../../shared/services/navigation.service";
import { ActivatedRoute, Router } from "@angular/router";
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent, FormsModule, CommonModule],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})

export class ResetPasswordCardComponent implements OnInit {
  navigationService: NavigationService = inject(NavigationService);
  route = inject(ActivatedRoute);
  auth = getAuth();
  private viewContainerRef = inject(ViewContainerRef); // Für dynamische Komponentenerstellung
  private injector = inject(EnvironmentInjector);
  private router = inject(Router);
  @Output() login = new EventEmitter<boolean>();

  mailData: string = '';
  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;
  oobCode: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      if (!this.oobCode) {
        this.errorMessage = 'Ungültiger oder abgelaufener Link.';
        this.isLoading = false;
        return;
      }

      verifyPasswordResetCode(this.auth, this.oobCode)
        .then(() => {
          this.isLoading = false;
        })
        .catch(() => {
          this.errorMessage = 'Ungültiger oder abgelaufener Link.';
          this.isLoading = false;
        });
    });
  }

  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }

  resetPassword() {
    if (!this.oobCode) {
      this.errorMessage = 'Kein gültiger Reset-Code gefunden.';
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(this.passwordData)) {
      this.errorMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      return;
    }
    this.isLoading = true;
    confirmPasswordReset(this.auth, this.oobCode, this.passwordData)
      .then(() => {
        this.isLoading = false;
        this.showPasswordChangedDialog(); // Dialog anzeigen
        this.resetPasswordSuccess(); // Bestätigungs-E-Mail senden
      })
      .catch(err => {
        this.isLoading = false;
        if (err.code === 'auth/invalid-action-code') {
          this.errorMessage = 'Der Link ist ungültig oder abgelaufen.';
        } else {
          this.errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
        }
        console.error('Passwort-Reset-Fehler:', err);
      });
  }

  resetPasswordSuccess() {
    const email = this.mailData; // Die E-Mail des Benutzers (muss im Formular abgefragt werden)
    const password = this.passwordData; // Das neue Passwort, das der Benutzer gesetzt hat

    // Benutzer erneut anmelden
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        // Nach erfolgreicher Anmeldung die Bestätigungs-E-Mail senden
        sendEmailVerification(userCredential.user)
          .then(() => {
            console.log('Bestätigungs-E-Mail wurde gesendet.');
          })
          .catch((err) => {
            console.error('Fehler beim Senden der Bestätigungs-E-Mail:', err);
          });
      })
      .catch((err) => {
        console.error('Fehler beim erneuten Anmelden:', err);
      });
  }

  // Dialog anzeigen
  showPasswordChangedDialog() {
    const componentRef = this.viewContainerRef.createComponent(PasswordChangedDialogComponent, {
      environmentInjector: this.injector,
    });

    setTimeout(() => {
      console.log('Navigiere zur Login-Seite'); // Debugging
      componentRef.destroy();
      this.router.navigate(['/login']).then(success => {
        if (!success) {
          console.error('Navigation zur Login-Seite fehlgeschlagen.');
        }
      });
    }, 3000);
  }
}
