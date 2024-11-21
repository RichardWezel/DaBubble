import { Component, inject } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-reset-password-card',
  standalone: true,
  imports: [CardComponent, FormsModule],
  templateUrl: './reset-password-card.component.html',
  styleUrl: './reset-password-card.component.scss'
})
export class ResetPasswordCardComponent {
  navigationService: NavigationService = inject(NavigationService);
  passwordData: string = '';
  confirmPasswordData: string = '';
  samePasswords = false;

  comparePasswords() {
    this.samePasswords = this.passwordData === this.confirmPasswordData;
  }

  sendMail() {
    console.log('Show confirmation sign');
    this.navigationService.navigateTo('/login');
  }

}
