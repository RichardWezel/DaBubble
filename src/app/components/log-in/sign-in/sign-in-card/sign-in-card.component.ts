import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { SignInService } from '../../../../shared/services/sign-in.service';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-sign-in-card',
  standalone: true,
  imports: [ CardComponent, FormsModule ],
  templateUrl: './sign-in-card.component.html',
  styleUrl: './sign-in-card.component.scss'
})
export class SignInCardComponent {
  signInService: SignInService = inject(SignInService);
  navigationService: NavigationService = inject(NavigationService);
  checkboxChecked: boolean = false;
  @Output() generateAccount = new EventEmitter<boolean>();


  /**
   * This method navigates the user to the card to choose an avatar.
   * For that, it emits an event to the sign-in component.
   */
  goToChooseAvatar() {
    this.generateAccount.emit(false);
  }
}
