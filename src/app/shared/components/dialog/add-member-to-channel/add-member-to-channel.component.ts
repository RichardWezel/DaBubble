import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../services/open-close-dialog.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';

@Component({
  selector: 'app-add-member-to-channel',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './add-member-to-channel.component.html',
  styleUrl: './add-member-to-channel.component.scss'
})
export class AddMemberToChannelComponent {

  storage = inject(FirebaseStorageService);

  isOpen: boolean = false;
  selectedOption: string = ''; 

  private subscriptions: Subscription = new Subscription();


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
    this.checkAllUsersHasBeenSelected();
    this.checkSpecificUserHasBeenSelected();
  }

  /**
   * Checks whether all users have been selected as an option and first defines all users and then adds them to the new channel.
   * 
   * @returns 
   */
  checkAllUsersHasBeenSelected() {
    if (this.selectedOption === "addAllUsers") {
      const channelId = this.storage.currentUser.currentChannel;
      if (!channelId) {
        console.error("Keine aktuelle Channel-ID gefunden.");
        return;
      }
      const allUserIds = this.defineAllUserIds();
      this.addAllUsersToNewChannel(allUserIds, channelId);
    }
  }


  /**
   * Checks if Add specific users is selected as an option and opens a dialogue to manually add individual users.
   */
  checkSpecificUserHasBeenSelected() {
    if (this.selectedOption === "addSpecificUser") {
      console.log('Navigation zum add-channel-member-dialog');
      this.openCloseDialogService.open('addChannelMember');
      this.closeDialog();
    }
  }


  /**
   * Adds all Users to the new created channel.
   * 
   * @param allUserIds - A map of all users with sorting out of undefined ids and the currentUser, as this is automatically a member of the channel when the channel is created.
   * @param channelId - id of current channel. When a new channel is created, it is immediately set as the current channel.
   */
  addAllUsersToNewChannel(allUserIds:string[], channelId: string) {
    this.storage.addUsersToChannel(channelId, allUserIds)
    .then(() => {
      this.closeDialog();
    })
    .catch(error => {
      console.error(`Fehler beim Hinzufügen aller Benutzer zum Channel "${channelId}":`, error);
    });
  }

  /**
   * Creates a map of all users with sorting out of undefined ids and the currentUser, as this is automatically a member of the channel when the channel is created.
   * 
   * @returns 
   */
  defineAllUserIds() {
    return this.storage.user
    .map(user => user.id)
    .filter((id): id is string => id !== undefined && id !== this.storage.currentUser.id);
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
