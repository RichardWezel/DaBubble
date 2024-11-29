import { Component } from '@angular/core';

@Component({
  selector: 'app-email-sent-dialog',
  standalone: true,
  templateUrl: './email-sent-dialog.component.html',
  styleUrls: ['./email-sent-dialog.component.scss'],
})
export class EmailSentDialogComponent {
  
  closeDialog() {
    const dialogElement = document.querySelector('.dialog-backdrop');
    if (dialogElement) {
      dialogElement.remove(); 
    }
  }
}