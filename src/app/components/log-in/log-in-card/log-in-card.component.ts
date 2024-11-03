import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgForm, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  focusOnMail = false;
  focusOnPassword = false;
  loginData = {
    email: "",
    password: ""
  };

  checkLogin(ngForm: NgForm) {
    console.log("LoginData: ", this.loginData);

  }
}
