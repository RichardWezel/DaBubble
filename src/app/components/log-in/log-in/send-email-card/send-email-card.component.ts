import { Component, EventEmitter, Output } from '@angular/core';
import { CardComponent } from "../../../../shared/components/log-in/card/card.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-send-email-card',
  standalone: true,
  imports: [CardComponent, FormsModule],
  templateUrl: './send-email-card.component.html',
  styleUrl: './send-email-card.component.scss'
})
export class SendEmailCardComponent {
  mailData: string = '';
  @Output() login = new EventEmitter<boolean>();

  goToLogin() {
    this.login.emit(true);
  }
}
