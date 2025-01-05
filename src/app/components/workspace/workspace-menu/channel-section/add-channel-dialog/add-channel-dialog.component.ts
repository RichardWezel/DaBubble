import { NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { NavigationService } from '../../../../../shared/services/navigation.service';
import { ChannelInterface } from '../../../../../shared/interfaces/channel.interface';

@Component({
  selector: 'app-add-channel-dialog',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './add-channel-dialog.component.html',
  styleUrls: ['./add-channel-dialog.component.scss'] // Corrected property name and format
})
export class AddChannelDialogComponent implements OnInit, OnDestroy {
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
  navigation = inject(NavigationService);

  // Neue Variable zur Überprüfung der Kanalnamen
  isChannelNameExists: boolean = false;
  errorMessage: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    public openCloseDialogService: OpenCloseDialogService,
  ) {}

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannel')
      ?.subscribe((status) => {
        this.isDialogVisible = status;
      });
    
    if (sub) this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public openDialog() {
    this.isDialogVisible = true;
  }

  public closeDialog() {
    this.openCloseDialogService.close('addChannel');
  }

  /**
   * Überprüft, ob der Channel-Name bereits existiert.
   * @returns boolean
   */
  isChannelNameTaken(): boolean {
    return !!this.findChannelName(this.channelData.name);
  }

  /**
    * Diese Methode wird beim Absenden des Formulars aufgerufen.
    */
  async openAddChannelMemberChoiseDialog() {
    if (this.isChannelNameTaken()) {
      this.isChannelNameExists = true;
      this.errorMessage = 'Der Channel-Name existiert bereits. Bitte wählen Sie einen anderen Namen.';
      return;
    } else {
      this.isChannelNameExists = false;
    }

    if(this.isChannelNameExists === false) {
      await this.takeChannelInfo();
      this.navigation.setChannel(this.storage.lastCreatedChannel);
      this.openCloseDialogService.open('addChannelMemberChoice');
      this.closeDialog();
    }
  }

  async takeChannelInfo(): Promise<void> {
    try {
      await this.storage.addChannel({ 
        name: this.channelData.name, 
        description: this.channelData.description, 
        owner: this.storage.currentUser.id || ""
      });
      this.closeDialog();
      this.channelData = {
        name: "",
        description: "",
        user: [this.storage.currentUser.id],
        owner: this.storage.currentUser.id,
        posts: [],
        id: ""
      };
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Channels:", error);
    }
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
  
}
