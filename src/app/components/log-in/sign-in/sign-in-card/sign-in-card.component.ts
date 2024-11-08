import { Component } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';

@Component({
  selector: 'app-sign-in-card',
  standalone: true,
  imports: [ CardComponent ],
  templateUrl: './sign-in-card.component.html',
  styleUrl: './sign-in-card.component.scss'
})
export class SignInCardComponent {

}
