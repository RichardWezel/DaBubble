import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
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
  getBack() {
    this.location.back();
  }
}