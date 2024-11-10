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
  pictures = ['profile-pictures/profile-1.png', 'profile-pictures/profile-2.png', 'profile-pictures/profile-3.png', 'profile-pictures/profile-4.png', 'profile-pictures/profile-5.png', 'profile-pictures/profile-6.png'];
  currentProfilePicture = 'profile-basic.png';
  avatarSelected = false;

  chosePicture(path: string) {
    this.currentProfilePicture = path;
  }
}
