import { Component, EventEmitter, Output, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  loginData = {
    email: '',
    password: ''
  };
  @Output() login = new EventEmitter<boolean>();

  // Funktion zum Navigieren zur Passwort-vergessen-Seite
  goToForgetPassword() {
    this.login.emit(false); // Wechselt zur "Send Email Card"
  }

  // Login mit E-Mail und Passwort
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
        const user = result.user;
        console.log('Eingeloggt mit Google: ', user);
        this.router.navigate(['/workspace']);
      })
      .catch((error) => {
        console.error('Fehler beim Google-Login: ', error.message);
        alert('Fehler bei der Anmeldung mit Google!');
      });
  }
}
