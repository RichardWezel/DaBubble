import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getAuth, applyActionCode } from 'firebase/auth';
import { SignInService } from '../../../../shared/services/sign-in.service'; // Service der SignInCardComponent

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.scss']
})
export class EmailVerifiedComponent implements OnInit {
  message: string = 'Bitte warten...'; // Initiale Nachricht
  isLoading: boolean = true; // Ladeindikator
  private signInService = inject(SignInService); // SignIn-Service importieren

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const auth = getAuth();
    this.route.queryParams.subscribe(async (params) => {
      const mode = params['mode'] || 'verifyEmail';
      const actionCode = params['oobCode'];

      if (mode === 'verifyEmail' && actionCode) {
        try {
          await applyActionCode(auth, actionCode); // E-Mail verifizieren
          this.message = 'Deine E-Mail-Adresse wurde erfolgreich bestätigt!';
          this.isLoading = false;

          // Nach erfolgreicher Verifizierung Benutzeraktionen ausführen
          // this.handlePostVerification();

          setTimeout(() => {
            this.router.navigate(['/login']); // Weiterleitung zur Login-Seite
          }, 3000);
        } catch (error: any) {
          console.error('Fehler bei der E-Mail-Bestätigung:', error);
          this.isLoading = false;
          this.message = this.getErrorMessage(error);
        }
      } else {
        this.isLoading = false;
        this.message = 'Ungültiger oder fehlender Bestätigungslink.';
        setTimeout(() => {
          this.router.navigate(['/login']); // Fallback-Weiterleitung
        }, 3000);
      }
    });
  }

  /**
   * Führt zusätzliche Aktionen nach der E-Mail-Bestätigung aus.
   */
  // private handlePostVerification(): void {
  //   // Nutze eine relevante Methode aus dem SignInService
  //   const currentUser = getAuth().currentUser;

  // }

  /**
   * Gibt eine benutzerfreundliche Fehlermeldung basierend auf dem Firebase-Fehlercode zurück.
   * @param error - Das Fehlerobjekt von Firebase.
   * @returns - Die Fehlermeldung als String.
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/expired-action-code':
        return 'Der Bestätigungslink ist abgelaufen. Bitte fordere eine neue E-Mail an.';
      case 'auth/invalid-action-code':
        return 'Der Bestätigungslink ist ungültig, da Ihre E-Mail bereits verifiziert wurde!'; 
      case 'auth/user-disabled':
        return 'Dein Konto wurde deaktiviert. Bitte kontaktiere den Support.';
      default:
        return 'Es ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut.';
    }
  }
}
