import { Component } from '@angular/core';
import { LogInCardComponent } from './log-in-card/log-in-card.component';
import { BackgroundWithSignInComponent } from "../../../shared/components/log-in/background-with-sign-in/background-with-sign-in.component";
import { SendEmailCardComponent } from "./send-email-card/send-email-card.component";

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [LogInCardComponent, BackgroundWithSignInComponent, SendEmailCardComponent],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.scss'
})
export class LogInComponent {
  login: boolean = true;
}
