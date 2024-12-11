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

  ngOnInit() {
    // Prüfen der URL-Parameter beim Start der Anwendung
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode']; // Typ der Aktion (verifyEmail, resetPassword)
      const oobCode = params['oobCode']; // Firebase Aktions-Code

      if (mode && oobCode) {
        this.handleFirebaseActions(mode, oobCode);
      }
    });

    // console.log('AppComponent ngOnInit aufgerufen');
    (window as any).status = this.status.bind(this);
  }

   /**
   * Verarbeitet Firebase-spezifische Aktionen basierend auf dem Modus
   * @param mode Der Modus der Aktion (z.B. verifyEmail, resetPassword)
   * @param oobCode Der Firebase OOB-Code zur Validierung
   */
   private handleFirebaseActions(mode: string, oobCode: string): void {
    switch (mode) {
      case 'resetPassword':
        this.router.navigate(['/resetpassword'], { queryParams: { oobCode } });
        break;
      case 'verifyEmail':
        this.router.navigate(['/emailverified'], { queryParams: { oobCode } });
        break;
      default:
        console.error('Unbekannter Modus:', mode);
        this.router.navigate(['/']); // Zurück zur Startseite oder Standardroute
        break;
    }
  }

  status() {
    console.log('Current User: ', this.storage.currentUser);
    console.log('Current channel of Current User', this.storage.currentUser.currentChannel);
    // Fügen Sie hier weitere console.log Ausgaben hinzu
  }
}
