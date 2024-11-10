import { Component } from '@angular/core';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-background',
  standalone: true,
  imports: [],
  templateUrl: './background.component.html',
  styleUrl: './background.component.scss'
})
export class BackgroundComponent {

  constructor(private navigationService: NavigationService) {}

  goToImprint() {
    this.navigationService.navigateTo('/imprint');
  }

  goToPrivacy() {
    this.navigationService.navigateTo('/privacy-policy');
  }
}
