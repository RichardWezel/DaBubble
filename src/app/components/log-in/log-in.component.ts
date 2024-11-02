import { Component } from '@angular/core';
import { LogInCardComponent } from './log-in-card/log-in-card.component';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [ LogInCardComponent ],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.scss'
})
export class LogInComponent {

}
