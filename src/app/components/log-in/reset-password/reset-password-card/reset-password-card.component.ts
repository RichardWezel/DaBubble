import { Component } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent, FormsModule],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent {
  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;

  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }

}
