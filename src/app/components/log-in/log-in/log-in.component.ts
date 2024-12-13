import { Component } from '@angular/core';
import { LogInCardComponent } from './log-in-card/log-in-card.component';
import { BackgroundWithSignInComponent } from "../../../shared/components/log-in/background-with-sign-in/background-with-sign-in.component";
import { SendEmailCardComponent } from "./send-email-card/send-email-card.component";
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [CommonModule, LogInCardComponent, BackgroundWithSignInComponent, SendEmailCardComponent],
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.scss']
})
export class LogInComponent {

  login: boolean = true;
  showLoading: boolean = true;
  password: boolean = false;


  /**
   * The constructor injects the 'ActivatedRoute' service to access information about the current route.
   * @param route - The Angular service used to access route-related information.
   */
  constructor(private route: ActivatedRoute) { }

  
  /**
   * When the component gets initialized, the passthe start overlay is shown for 3 seconds.
   */
  ngOnInit() {
    this.isPasswordResetRoute();
    setTimeout(() => {
      this.showLoading = false;
    }, 3000);
  }


  /**
   * Checks if the current route URL contains sepcific segments.
   * If both segments are prsent, the 'password' property is set to true.
   */
  isPasswordResetRoute() {
    const urlSegments = this.route.snapshot.url.map(segment => segment.path);
    if (urlSegments.includes('password-main') && urlSegments.includes('reset-password')) {
      this.password = true;
    }
  }
}
