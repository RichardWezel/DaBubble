import { Component, inject, Input } from '@angular/core';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-background-with-sign-in',
  standalone: true,
  imports: [],
  templateUrl: './background-with-sign-in.component.html',
  styleUrl: './background-with-sign-in.component.scss'
})
export class BackgroundWithSignInComponent {
  navigationService: NavigationService = inject(NavigationService);
  @Input() newAccount: boolean = true;
}
