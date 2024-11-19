import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';
import { FormsModule } from '@angular/forms';
import { SignInService } from '../../../../shared/services/sign-in.service';

@Component({
  selector: 'app-sign-in-card',
  standalone: true,
  imports: [ CardComponent, FormsModule ],
  templateUrl: './sign-in-card.component.html',
  styleUrl: './sign-in-card.component.scss'
})
export class SignInCardComponent {
  signInService: SignInService = inject(SignInService);
  checkboxChecked: boolean = false;
  @Output() generateAccount = new EventEmitter<boolean>();

  goToChooseAvatar() {
    this.generateAccount.emit(false);
  }
}
