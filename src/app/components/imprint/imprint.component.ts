import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [],
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent {

  /**
   * Constructor for the ResetPasswordComponent, injects the necessary dependencies.
   * @param location - The Angular Location service used for interacting with the browser's URL.
   */
  constructor(private location: Location) {}

  /**
   * Navigates the user to the previous page in the browser's history.
   */
  goBack() {
    this.location.back();
  }
}
