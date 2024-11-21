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

  constructor(public navigationService: NavigationService) {}
}
