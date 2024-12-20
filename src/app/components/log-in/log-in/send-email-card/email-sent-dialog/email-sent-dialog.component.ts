import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-email-sent-dialog',
  standalone: true,
  imports: [ CommonModule ], 
  templateUrl: './email-sent-dialog.component.html',
  styleUrls: ['./email-sent-dialog.component.scss'],
})
export class EmailSentDialogComponent {
  @Input() email: string = ''; // Show email address
  @Input() showDialog: boolean = false; // Control the dialog
  @Output() close = new EventEmitter<void>(); // Emit closing event


  /**
   * Closes the confirmation dialog for sending the link to the email address.
   */
  closeDialog() {
    this.showDialog = false;
    this.close.emit(); // Trigger event
  }
}
