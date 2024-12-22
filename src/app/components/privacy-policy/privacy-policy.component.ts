import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { CardComponent } from '../../shared/components/log-in/card/card.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})

export class PrivacyPolicyComponent {

  /**
   * Constructor for the ResetPasswordComponent, injects the necessary dependencies.
   * @param location - The Angular Location service used for interacting with the browser's URL.
   */
  constructor(private location: Location) { }


  /**
   * Navigates the user to the previous page in the browser's history.
   */
  goBack() {
    this.location.back();
  }
}