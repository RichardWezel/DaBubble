import { Component } from '@angular/core';

@Component({
  selector: 'app-log-in-card',
  standalone: true,
  imports: [],
  templateUrl: './log-in-card.component.html',
  styleUrl: './log-in-card.component.scss'
})
export class LogInCardComponent {
  focusOnMail = false;
  focusOnPassword = false;
}
