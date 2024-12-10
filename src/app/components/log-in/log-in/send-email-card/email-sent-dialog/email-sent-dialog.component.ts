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
  @Input() email: string = ''; // E-Mail-Adresse anzeigen
  @Input() showDialog: boolean = false; // Dialog steuern
  @Output() close = new EventEmitter<void>(); // Event auslösen, um zu schließen

  closeDialog() {
    this.showDialog = false;
    this.close.emit(); // Event auslösen
  }
}
