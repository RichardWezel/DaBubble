import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
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


  /**
   * Subscribes to the dialog open/close state and initializes the dialog state.
   */
  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMemberChoice')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    
    if (sub) this.subscriptions.add(sub);
    console.log()
  }


  /**
   * Unsubscribes from all active subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /**
   * Closes the dialog for adding channel members.
   */
  public closeDialog() {
    this.openCloseDialogService.close('addChannelMemberChoice');
  }


  /**
   * Handles the change in selection within the dialog, logging the selected option.
   */
  onOptionChange() {
    console.log(`Ausgewählte Option: ${this.selectedOption}`);
  }


  /**
   * Handles the action based on the user's selection, either adding all users to the current channel
   * or opening another dialog to add specific users.
   */
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
   * Retrieves the name of a channel based on its ID.
   * @param {string} channelId - The ID of the channel.
   * @returns {string} The name of the channel, or an empty string if the channel is not found.
   */
  getChannelName(channelId: string): string {
   const channel = this.storage.channel.find(ch => ch.id === channelId);
   return channel ? channel.name : '';
  }
}
