import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { FirebaseStorageService } from './shared/services/firebase-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'da-bubble';

  storage = inject(FirebaseStorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() { }

  /**
   * Initializes the component by subscribing to route query parameters and setting up window status.
   */
  ngOnInit() {
    // Checking URL parameters at the start of the application
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode']; // Type of action (verifyEmail, resetPassword)
      const oobCode = params['oobCode']; // Firebase action code

      if (mode && oobCode) {
        this.handleFirebaseActions(mode, oobCode);
      }
    });

    // Log the call of ngOnInit for AppComponent
    (window as any).status = this.status.bind(this);
  }

  /**
   * Processes Firebase-specific actions based on the mode provided in the URL parameters.
   * @param mode The mode of the action (e.g., verifyEmail, resetPassword)
   * @param oobCode The Firebase OOB (Out of Band) code for validation
   */
  private handleFirebaseActions(mode: string, oobCode: string): void {
    switch (mode) {
      case 'resetPassword':
        this.router.navigate(['/resetpassword'], { queryParams: { oobCode } });
        break;
      case 'verifyEmail':
        this.router.navigate(['/emailverified'], { queryParams: { oobCode } });
        break;
      case 'verifyAndChangeEmail':
        this.router.navigate(['/emailverified'], { queryParams: { oobCode } });
        break;
      default:
        console.error('Unknown mode:', mode);
        this.router.navigate(['/']); // Navigate back to home page or default route
        break;
    }
  }

  /**
   * Logs the current user details and channel to the console.
   */
  status() {
    console.log('Current User: ', this.storage.currentUser);
    console.log('Current channel of Current User', this.storage.currentUser.currentChannel);
  }
}