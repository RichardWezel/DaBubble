import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {
  @Output() close = new EventEmitter<boolean>(); // Emit closing event


  /**
   * Closes the confirmation modal.
   */
  closeDialog() {
    this.close.emit(false);
  }
}
