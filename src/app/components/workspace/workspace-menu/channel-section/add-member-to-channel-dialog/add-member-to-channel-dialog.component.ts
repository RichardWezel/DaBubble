import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
@Component({
  selector: 'app-add-member-to-channel-dialog',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './add-member-to-channel-dialog.component.html',
  styleUrl: './add-member-to-channel-dialog.component.scss'
})
export class AddMemberToChannelDialogComponent {

  isOpen: boolean = false;
  selectedOption: string = ''; 
  private subscriptions: Subscription = new Subscription();
  storage = inject(FirebaseStorageService);
  constructor(public openCloseDialogService: OpenCloseDialogService) {}

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMemberChoice')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    
    if (sub) this.subscriptions.add(sub);
    console.log()
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public closeDialog() {
    this.openCloseDialogService.close('addChannelMemberChoice');
  }

  onOptionChange() {
    console.log(`Ausgewählte Option: ${this.selectedOption}`);
  }

  handleSelection() {
    if (this.selectedOption === "addAllUsers") {
      const channelId = this.storage.currentUser.currentChannel;
      if (!channelId) {
        console.error("Keine aktuelle Channel-ID gefunden.");
        return;
      }
      const allUserIds = this.storage.user
        .map(user => user.id)
        .filter((id): id is string => id !== undefined && id !== this.storage.currentUser.id);
      this.storage.addUsersToChannel(channelId, allUserIds)
        .then(() => {
          this.closeDialog();
        })
        .catch(error => {
          console.error(`Fehler beim Hinzufügen aller Benutzer zum Channel "${channelId}":`, error);
        });
    }
  
    if (this.selectedOption === "addSpecificUser") {
      console.log('Navigation zum add-channel-member-dialog');
      this.openCloseDialogService.open('addChannelMember');
      this.closeDialog();
    }
  }
  

  /**
   * Retrieves the channel name based on the channel ID.
   * @param channelId - The ID of the channel.
   * @returns The name of the channel or an empty string if not found.
   */
  getChannelName(channelId: string): string {
   const channel = this.storage.channel.find(ch => ch.id === channelId);
   return channel ? channel.name : '';
  }
}
