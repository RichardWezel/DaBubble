import { Component, Input, inject, Output, EventEmitter, HostListener } from '@angular/core';
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

  constructor(private firebaseStorageService: FirebaseStorageService, private router: Router) { }


  /**
   * Closes the dialog by click on esc key.
   * 
   * @param event - click escape Key
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    this.closeDialog();
  }


  /**
   * Closes the Dialog
   */
  closeDialog(): void {
    this.close.emit();
  }


  /**
   * Let appear the edit input to change the channel description.
   */
  editDescription(): void {
    this.isEditingDescription = true;
  }


  /**
   * Saves the channel description.
   */
  saveDescription(): void {
    if (this.channelId) {
      this.firebaseStorageService
        .updateChannel(this.channelId, { description: this.channelDescription })
        .then(() => {
          this.isEditingDescription = false;
        })
        .catch((error) => {
          console.error('Fehler beim Speichern der Channel-Beschreibung:', error);
        });
    } else {
      console.error('Channel-ID fehlt. Änderungen können nicht gespeichert werden.');
    }
  }


  /**
   * Let appear the edit input to change the channel name.
   */
  editChannelName(): void {
    this.isEditingChannelName = true;
  }


  /**
   * Checks whether the channel ID exists and whether the new channel name already exists for another channel. 
   * If the check is successful, the channel information is updated
   * 
   * @returns void
   */
  async saveChannelName(): Promise<void> {
    if (!this.channelId) {
      console.error('Channel-ID fehlt. Änderungen können nicht gespeichert werden.');
      return;
    }
    if (await this.firebaseStorageService.channelNameExists(this.channelId, this.channelName)) {
      this.errorMessage = 'Der Channel-Name existiert bereits. Bitte wählen Sie einen anderen Namen.';
      return;
    }
    this.saveChannelInformations();
  }


  /**
   * Saves the new channel-informations on firebase.
   */
  saveChannelInformations() {
    this.firebaseStorageService.updateChannel(this.channelId, {
      name: this.channelName,
      description: this.channelDescription
    }).then(() => {
      this.isEditingChannelName = false;
      this.errorMessage = '';
    }).catch((error) => {
      console.error('Fehler beim Speichern des Channel-Namens:', error);
    });
  }


  /**
  * Checks whether the channel name already exists.
  * @returns boolean
  */
  isChannelNameTaken(): boolean {
    return !!this.findChannelName(this.channelName);
  }


  /**
   * Searches for a channel with the specified name.
   * @param inputChannel string
   * @returns string | undefined
   */
  findChannelName(inputChannel: string): string | undefined {
    let channels: ChannelInterface[] = this.storage.CurrentUserChannel;
    let match = channels.find(channel =>
      channel.name.toLowerCase() === inputChannel.toLowerCase());
    return match?.name!;
  }


  /**
   * Performs a rewind of the channel in the program.
   * 
   * @returns void
   */
  leaveChannel(): void {
    if (!this.channelId) {
      console.error('Channel-ID fehlt. Kann Channel nicht verlassen.');
      return;
    }
    const currentUserId = this.firebaseStorageService.currentUser.id;
    this.firebaseStorageService.updateChannel(this.channelId, {
      user: this.firebaseStorageService.channel
        .find(channel => channel.id === this.channelId)?.user
        .filter(userId => userId !== currentUserId) || [],
    }).then(() => {
      this.handelAfterDeleteChannelForUser();
    }).catch((error) => {
      console.error('Fehler beim Verlassen des Channels:', error);
    });
  }


  /**
   * Handels the todos after rewind the channel.
   */
  handelAfterDeleteChannelForUser() {
    this.firebaseStorageService.currentUser.currentChannel = '';
    sessionStorage.removeItem('currentChannel');
    this.router.navigate(['/workspace']);
    this.close.emit();
  }
}