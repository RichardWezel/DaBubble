import { Component, EventEmitter, inject, Output } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [FormsModule, CardComponent, CommonModule],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  loginData = {
    email: "",
    password: ""
  };
  @Output() login = new EventEmitter<boolean>();

  
  goToForgetPassword() {
    this.login.emit(false);
  }

  
  checkLogin(ngForm: NgForm) {
    console.log("LoginData: ", this.loginData);
    signInWithEmailAndPassword(this.auth, this.loginData.email, this.loginData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Eingeloggt', user);
        this.router.navigate(['/workspace']);
      })
      .catch((error) => {
        console.error("Fehler beim Einloggen: ", error.message);
      });
  }

  guestLogin() {
    this.router.navigate(['/workspace']);
  }
}
