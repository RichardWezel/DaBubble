import { Component, EventEmitter, Output, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updatePassword } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ResetPasswordCardComponent } from '../../reset-password/reset-password-card/reset-password-card.component';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [FormsModule, CardComponent, CommonModule],
  templateUrl: './log-in-card.component.html',
  styleUrls: ['./log-in-card.component.scss']
})
export class LogInCardComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;

  loginData = {
    email: '',
    password: ''
  };
  @Output() login = new EventEmitter<boolean>();


  goToResetPassword() {
    this.router.navigate(['/reset-password']);
  }


  checkLogin(ngForm: NgForm) {
    console.log('LoginData: ', this.loginData);
    signInWithEmailAndPassword(this.auth, this.loginData.email, this.loginData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Eingeloggt', user);
        this.router.navigate(['/workspace']);
      })
      .catch((error) => {
        console.error('Fehler beim Einloggen: ', error.message);
        alert('Anmeldung fehlgeschlagen! Überprüfe die Anmeldedaten.');
      });
  }

  // Gast-Login (direkt zum Workspace)
  guestLogin() {
    this.router.navigate(['/workspace']);
  }

  // Google-Login
  googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        console.log(result);
        const user = result.user;
        console.log('Eingeloggt mit Google: ', user);
        this.router.navigate(['/workspace']);
      })
      .catch((error) => {
        console.error('Fehler beim Google-Login: ', error.message);
        alert('Fehler bei der Anmeldung mit Google!');
      });
  }

  // Passwort zurücksetzen
  resetPassword() {
    if (this.samePasswords) {

      const user = this.auth.currentUser;
      if (user) {
        updatePassword(user, this.passwordData)
          .then(() => {
            alert('Passwort erfolgreich zurückgesetzt!');
            this.router.navigate(['/login']);
          })
          .catch((error) => {
            console.error('Fehler beim Zurücksetzen des Passworts:', error);
            alert('Es gab ein Problem beim Zurücksetzen des Passworts. Bitte versuche es erneut.');
          });
      }
    } else {
      alert('Die Passwörter stimmen nicht überein. Bitte überprüfe deine Eingaben.');
    }
  }
}
