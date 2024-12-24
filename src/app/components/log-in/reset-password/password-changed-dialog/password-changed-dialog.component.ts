import { Component } from '@angular/core';


@Component({
  selector: 'app-password-changed-dialog',
  standalone: true,
  templateUrl: './password-changed-dialog.component.html',
  styleUrls: ['./password-changed-dialog.component.scss'],
})
export class PasswordChangedDialogComponent {
  
  /**
   * Closes the confirmation dialog for the successful password change.
   */
  closeDialog() {
    const dialogElement = document.querySelector('.dialog-backdrop');
    if (dialogElement) {
      dialogElement.remove(); 
    }
  }
}