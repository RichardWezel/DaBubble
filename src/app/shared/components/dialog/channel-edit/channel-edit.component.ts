import { Component, Input, inject ,Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { Router } from '@angular/router';
import { ChannelInterface } from '../../../interfaces/channel.interface';
import { MemberContainerComponent } from '../../member-container/member-container.component'; 

@Component({
  selector: 'app-channel-edit',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule,
    MemberContainerComponent],  
  templateUrl: './channel-edit.component.html',
  styleUrls: ['./channel-edit.component.scss']
})
export class ChannelEditComponent {
  @Input() channelId: string = '';
  @Input() channelName: string = ''; 
  @Input() channelDescription: string = ''; 
  @Input() creatorName: string = ''; 
  @Output() close = new EventEmitter<void>(); 
  protected storage = inject(FirebaseStorageService);
  isEditingDescription: boolean = false;
  isEditingChannelName: boolean = false; 
  errorMessage: string = ""; 

  constructor(private firebaseStorageService: FirebaseStorageService,  private router: Router) {}


  /**
   * Closes the dialog by click on esc key.
   * 
   * @param event - click escape Key
   */
  @HostListener('document:keydown.escape', ['$event']) 
  handleEscape(event: KeyboardEvent) {
    
    this.closeDialog();
    
  }


  save(): void {
    console.log('Channel gespeichert:', this.channelName, this.channelDescription);
    this.close.emit(); 
  }
  
  closeDialog(): void {
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

  // in channel-edit.component.ts

async saveChannelName(): Promise<void> {
  if (!this.channelId) {
    console.error('Channel-ID fehlt. Änderungen können nicht gespeichert werden.');
    return;
  }

  if (await this.firebaseStorageService.channelNameExists(this.channelId, this.channelName)) {
    this.errorMessage = 'Der Channel-Name existiert bereits. Bitte wählen Sie einen anderen Namen.';
    return;
  }

  // Wenn der Name nicht existiert, führe die Update-Operation durch
  this.firebaseStorageService.updateChannel(this.channelId, {
    name: this.channelName,
    description: this.channelDescription
  }).then(() => {
    this.isEditingChannelName = false;
    this.errorMessage = '';
    console.log('Channel-Name erfolgreich gespeichert:', this.channelName);
  }).catch((error) => {
    console.error('Fehler beim Speichern des Channel-Namens:', error);
  });
}



   /**
   * Überprüft, ob der Channel-Name bereits existiert.
   * @returns boolean
   */
   isChannelNameTaken(): boolean {
    return !!this.findChannelName(this.channelName);
  }

  /**
   * Sucht nach einem Channel mit dem angegebenen Namen.
   * @param inputChannel string
   * @returns string | undefined
   */
  findChannelName(inputChannel: string): string | undefined {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase() === inputChannel.toLowerCase());
    console.log('inputChannel: ', inputChannel, 'foundChannel: ', match?.name!);
    return match?.name!;
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
      this.firebaseStorageService.currentUser.currentChannel = '';
      sessionStorage.removeItem('currentChannel'); 
      this.router.navigate(['/workspace']);
      this.close.emit(); 
    }).catch((error) => {
      console.error('Fehler beim Verlassen des Channels:', error);
    });
  }
}