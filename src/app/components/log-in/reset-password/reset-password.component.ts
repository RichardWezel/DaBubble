import { Component } from '@angular/core';
import { BackgroundComponent } from '../../../shared/components/log-in/background/background.component';
import { ResetPasswordCardComponent } from "./reset-password-card/reset-password-card.component";

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [BackgroundComponent, ResetPasswordCardComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {

}
