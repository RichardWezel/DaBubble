import { Component, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [FormsModule, CardComponent, CommonModule, RouterLink],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  private auth = inject(Auth);
  loginData = {
    email: "",
    password: ""
  };

  checkLogin(ngForm: NgForm) {
    console.log("LoginData: ", this.loginData);
    signInWithEmailAndPassword(this.auth, this.loginData.email, this.loginData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Logged in', user);
        const uid = user.uid;
        console.log('UID', uid);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      })
  }
}
