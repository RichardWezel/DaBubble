import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-add-channel-dialog',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './add-channel-dialog.component.html',
  styleUrls: ['./add-channel-dialog.component.scss'] // Corrected property name and format
})
export class AddChannelDialogComponent {
  protected storage = inject(FirebaseStorageService);
  isDialogVisible: boolean = false;
  channelData = {
    name: "",
    description: "",
    user: [this.storage.currentUser.id],
    owner: this.storage.currentUser.id,
    posts: [],
    id: ""
  };

  public openDialog() {
    this.isDialogVisible = true;
  }

  public closeDialog() {
    this.isDialogVisible = false;
  }

  takeChannelInfo() {
    this.storage.addChannel({ 
      name: this.channelData.name, 
      description: this.channelData.description, 
      owner: this.storage.currentUser.id || ""
    }).then(() => {
      // Optionale Aktionen nach erfolgreichem Hinzufügen
      this.closeDialog();
      // Optional: Formular zurücksetzen
      this.channelData = {
        name: "",
        description: "",
        user: [this.storage.currentUser.id],
        owner: this.storage.currentUser.id,
        posts: [],
        id: ""
      };
    }).catch(error => {
      console.error("Fehler beim Hinzufügen des Channels:", error);
      // Optional: Fehlerbehandlung für den Benutzer
    });
  }
  
}
