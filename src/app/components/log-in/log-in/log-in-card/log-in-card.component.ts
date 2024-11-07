import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@firebase/auth';


@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [ RouterLink, FormsModule ],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  private auth = inject(Auth);
  focusOnMail = false;
  focusOnPassword = false;
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
