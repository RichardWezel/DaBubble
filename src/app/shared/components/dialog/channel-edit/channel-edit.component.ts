import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-channel-edit',
  standalone: true, 
  imports: [CommonModule, FormsModule],  
  templateUrl: './channel-edit.component.html',
  styleUrls: ['./channel-edit.component.scss']
})
export class ChannelEditComponent {
  @Input() channelId: string = '';
  @Input() channelName: string = ''; 
  @Input() channelDescription: string = ''; 
  @Input() creatorName: string = ''; 
  @Output() close = new EventEmitter<void>(); 

  isEditingDescription: boolean = false;
  isEditingChannelName: boolean = false; 

  constructor(private firebaseStorageService: FirebaseStorageService,  private router: Router) {}

  save(): void {
    console.log('Channel gespeichert:', this.channelName, this.channelDescription);
    this.close.emit(); 
  }

  
  cancel(): void {
    this.close.emit(); 
  }

  editDescription(): void {
    this.isEditingDescription = true; 
  }
  
  saveDescription(): void {
    if (this.channelId) {
      this.firebaseStorageService
        .updateChannel(this.channelId, { description: this.channelDescription })
        .then(() => {
          this.isEditingDescription = false;
          console.log('Channel-Beschreibung erfolgreich gespeichert:', this.channelDescription);
        })
        .catch((error) => {
          console.error('Fehler beim Speichern der Channel-Beschreibung:', error);
        });
    } else {
      console.error('Channel-ID fehlt. Änderungen können nicht gespeichert werden.');
    }
  }

  editChannelName(): void {
    this.isEditingChannelName = true; 
  }
  
  saveChannelName(): void {
    if (!this.channelId) {
      console.error('Channel-ID fehlt. Änderungen können nicht gespeichert werden.');
      return;
    }
  
    const description = this.channelDescription || ''; // Fallback für description
  
    console.log('Channel-Daten zum Speichern:', {
      name: this.channelName,
      description: description,
    });
  
    this.firebaseStorageService.updateChannel(this.channelId, {
      name: this.channelName,
      description: description, // `undefined` wird durch einen leeren String ersetzt
    }).then(() => {
      this.isEditingChannelName = false;
      console.log('Channel-Name erfolgreich gespeichert:', this.channelName);
    }).catch((error) => {
      console.error('Fehler beim Speichern des Channel-Namens:', error);
    });
  }
  
  

  
  leaveChannel(): void {
    if (!this.channelId) {
      console.error('Channel-ID fehlt. Kann Channel nicht verlassen.');
      return;
    }
  
    const currentUserId = this.firebaseStorageService.currentUser.id;
  
    // Entferne den Benutzer aus dem Channel
    this.firebaseStorageService.updateChannel(this.channelId, {
      user: this.firebaseStorageService.channel
        .find(channel => channel.id === this.channelId)?.user
        .filter(userId => userId !== currentUserId) || [],
    }).then(() => {
      console.log('Channel erfolgreich verlassen');
      this.firebaseStorageService.currentUser.currentChannel = '';
      sessionStorage.removeItem('currentChannel'); 
      this.router.navigate(['/workspace']);
      this.close.emit(); 
    }).catch((error) => {
      console.error('Fehler beim Verlassen des Channels:', error);
    });
  }
}
