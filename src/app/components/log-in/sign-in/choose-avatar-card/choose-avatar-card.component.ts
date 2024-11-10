import { Component } from '@angular/core';
import { CardComponent } from '../../../../shared/components/log-in/card/card.component';

@Component({
  selector: 'app-choose-avatar-card',
  standalone: true,
  imports: [ CardComponent ],
  templateUrl: './choose-avatar-card.component.html',
  styleUrl: './choose-avatar-card.component.scss'
})
export class ChooseAvatarCardComponent {
  numbersOfProfilePictures = [1, 2, 3, 4, 5, 6];
}
