import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { getAuth, applyActionCode } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-email-verified',
  standalone: true,
  imports: [],
  templateUrl: './email-verified.component.html',
  styleUrl: './email-verified.component.scss'
})
export class EmailVerifiedComponent implements OnInit {
  message: string = 'Bitte warten...'; // Initial message
  isLoading: boolean = true; // Loading indicator


  /**
   * The constructor of the component.
   * @param route - The ActivatedRouteService that provides access to URL parameters and the route state.
   * @param router - The Router service responsible for navigating between pages.
   */
  constructor(private route: ActivatedRoute, private router: Router) { }


  /**
   * Initializes the component and handles the email verification process.
   */
  async ngOnInit() {
    const auth = getAuth();
    this.route.queryParams.subscribe(async (params) => {
      const mode = this.gettingParameterModeFromURL(params);
      const actionCode = this.gettingOobCodeFromURL(params);
      if (mode === 'verifyEmail' && actionCode) await this.handleValidMailVerification(auth, actionCode);
      else if (mode === 'verifyAndChangeEmail' && actionCode) await this.handleValidMailVerification(auth, actionCode);
      else if (mode === 'recoverEmail' && actionCode) await this.handleRecoverEmail(auth, actionCode);
      else this.handleInvalidMailVerification();
    });
  }


  /**
   * Retrieves the 'mode' parameter from the URL query parameters.
   * If the 'mode' parameter is not present, it returns the default value 'verifyEmail'.
   * @param params - The query parameters from the current route.
   * @returns - The value of the 'mode' parameter or 'verifyEmail' if not found.
   */
  gettingParameterModeFromURL(params: Params): string {
    return params['mode'] ? params['mode'] : 'verifyEmail';
  }


  /**
   * Retrieves the 'oobCode' (out-of-band code) parameter from the URL query parameters.
   * @param params - The query parameters from the current route.
   * @returns - The value of the 'oobCode' parameter or 'undefined' if not found.
   */
  gettingOobCodeFromURL(params: Params): string | undefined {
    return params['oobCode']
  }


  /**
   * Handles the email verfification process when the action code is valid.
   * @param auth - The authentication instance used to verify the action code.
   * @param actionCode - The verification code sent to the user's email, used to verifiy the email address.
   * @returns - A promise that resolves when the email verification process is complete.
   */
  async handleValidMailVerification(auth: Auth, actionCode: string): Promise<void> {
    try {
      await applyActionCode(auth, actionCode); // Verifying email
      this.message = 'Deine E-Mail-Adresse wurde erfolgreich bestätigt!';
      this.isLoading = false;

      setTimeout(() => {
        this.router.navigate(['/login']); // Navigation to log-in page
      }, 3000);
    } catch (error: any) {
      this.isLoading = false;
      this.message = this.getErrorMessage(error);
    }
  }


  /**
   * Handles the scenario when the email verification is invalid.
   */
  handleInvalidMailVerification() {
    this.isLoading = false;
    this.message = 'Ungültiger oder fehlender Bestätigungslink.';
    setTimeout(() => {
      this.router.navigate(['/login']); // Fallback-Weiterleitung
    }, 3000);
  }


  async handleRecoverEmail(auth: Auth, actionCode: string): Promise<void> {
    try {
      this.isLoading = true;
      await applyActionCode(auth, actionCode);
  
      this.message = "Deine E-Mail-Adresse wurde erfolgreich zurückgesetzt.";
  
      this.isLoading = false;

      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
  
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (error: any) {
      this.isLoading = false;
      this.message = this.getErrorMessageRecoverEmail(error);
    }
  }


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

  getErrorMessageRecoverEmail(error: any): string {
    switch (error.code) {
      case 'auth/expired-action-code':
        return 'Der Bestätigungslink ist abgelaufen. Bitte fordere eine neue E-Mail an.';
      case 'auth/invalid-action-code':
        return 'Der Bestätigungslink ist ungültig, da Ihre E-Mail bereits zurückgeändert wurde!';
      case 'auth/user-disabled':
        return 'Dein Konto wurde deaktiviert. Bitte kontaktiere den Support.';
      default:
        return 'Es ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut.';
    }
  }
}

