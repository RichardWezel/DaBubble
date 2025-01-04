import { NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { Subscription } from 'rxjs';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';

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

  async openAddChannelMemberChoiseDialog() {
    await this.takeChannelInfo();
    // hier dann noch den neuen channel setzen!
    this.openCloseDialogService.open('addChannelMemberChoice');
    this.closeDialog();
  }
  
}
