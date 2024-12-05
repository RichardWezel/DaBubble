import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getAuth, applyActionCode } from 'firebase/auth';

@Component({
  selector: 'app-email-verified',
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.scss']
})
export class EmailVerifiedComponent implements OnInit {
  message: string = 'Bitte warten...'; // Initiale Nachricht

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const auth = getAuth();
    this.route.queryParams.subscribe(async (params) => {
      const mode = params['mode'];
      const actionCode = params['oobCode'];

      if (mode === 'verifyEmail' && actionCode) {
        try {
          await applyActionCode(auth, actionCode); // E-Mail bestätigen
          this.message = 'Deine E-Mail-Adresse wurde erfolgreich bestätigt!';
          setTimeout(() => {
            this.router.navigate(['/login']); // Weiterleitung zur Login-Seite
          }, 3000); // Nach 3 Sekunden weiterleiten
        } catch (error) {
          console.error('Fehler bei der E-Mail-Bestätigung:', error);
          this.message = 'Fehler bei der E-Mail-Bestätigung. Bitte versuche es erneut.';
        }
      } else {
        this.message = 'Ungültiger Bestätigungslink.';
      }
    });
  }
}
