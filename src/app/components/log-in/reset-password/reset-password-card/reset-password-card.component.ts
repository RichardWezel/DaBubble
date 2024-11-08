import { Component } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent {

}
