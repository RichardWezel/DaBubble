import { Component, inject } from '@angular/core';


@Component({
  selector: 'app-password-changed-dialog',
  standalone: true,
  templateUrl: './password-changed-dialog.component.html',
  styleUrls: ['./password-changed-dialog.component.scss'],
})
export class PasswordChangedDialogComponent {
    
  closeDialog() {
    const dialogElement = document.querySelector('.dialog-backdrop');
    if (dialogElement) {
      dialogElement.remove(); 
    }
  }
}