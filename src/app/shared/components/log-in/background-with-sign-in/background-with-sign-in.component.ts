import { Component } from '@angular/core';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-background-with-sign-in',
  standalone: true,
  imports: [],
  templateUrl: './background-with-sign-in.component.html',
  styleUrl: './background-with-sign-in.component.scss'
})
export class BackgroundWithSignInComponent {

  constructor(private navigationService: NavigationService) {}

  goToImprint() {
    this.navigationService.navigateTo('/imprint');
  }

  goToPrivacy() {
    this.navigationService.navigateTo('/privacy-policy');
  }
}
