import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-edit',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './channel-edit.component.html',
  styleUrls: ['./channel-edit.component.scss']
})
export class ChannelEditComponent {
  @Input() channelName: string = ''; 
  @Input() channelDescription: string = ''; 
  @Input() creatorName: string = ''; 
  @Output() close = new EventEmitter<void>(); 

  isEditingDescription: boolean = false;
  isEditingChannelName: boolean = false; // Zustand für den Bearbeitungsmodus

  save(): void {
    console.log('Channel gespeichert:', this.channelName, this.channelDescription);
    this.close.emit(); 
  }

  
  cancel(): void {
    this.close.emit(); 
  }

  editDescription(): void {
    this.isEditingDescription = true; // Umschalten in Editiermodus
  }
  
  saveDescription(): void {
    this.isEditingDescription = false; // Zurück zum Anzeigenmodus
    console.log('Neue Beschreibung gespeichert:', this.channelDescription);
  }

  editChannelName(): void {
    this.isEditingChannelName = true; // Aktiviert den Bearbeitungsmodus
  }
  
  saveChannelName(): void {
    this.isEditingChannelName = false; // Beendet den Bearbeitungsmodus
    console.log('Neuer Channel-Name gespeichert:', this.channelName);
  }

  
  leaveChannel(): void {
    console.log('Channel verlassen');
    this.close.emit(); 
  }
}
