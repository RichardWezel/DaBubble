import { Component, EventEmitter, inject, Output } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [FormsModule, CardComponent],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  private auth = inject(Auth);
  private router = inject(Router); // Inject Router
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
        console.log('Logged in', user);
        const uid = user.uid;
        console.log('UID', uid);
        this.router.navigate(['/workspace']); // Navigate to the chat page
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  }

  // Guest login function
  guestLogin() {
    this.router.navigate(['/workspace']); // Navigate to chat page for guest login
  }
}
