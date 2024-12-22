import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FirebaseStorageService } from '../../../../../shared/services/firebase-storage.service';
import { CloudStorageService } from '../../../../../shared/services/cloud-storage.service';
import { OpenCloseDialogService } from '../../../../../shared/services/open-close-dialog.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserInterface } from '../../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-add-channel-member-dialog',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './add-channel-member-dialog.component.html',
  styleUrl: './add-channel-member-dialog.component.scss'
})
export class AddChannelMemberDialogComponent {

  @Input() channelUsers: string[] = [];
  searchResult: UserInterface[] = [];
  userInput: string = "";
  storage = inject(FirebaseStorageService);
  cloud = inject(CloudStorageService);
  openCloseDialogService = inject(OpenCloseDialogService);
  isOpen: boolean = true;
  private subscriptions: Subscription = new Subscription();
  addedUser: UserInterface[] = [];

  constructor() { }

  ngOnInit(): void {
    const sub = this.openCloseDialogService
      .isDialogOpen('addChannelMember')
      ?.subscribe((status) => {
        this.isOpen = status;
      });
    if (sub) this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public openDialog() {
    this.isOpen = true;
  }

  public closeDialog() {
    this.isOpen = false;
  }

   /**
   * During input in the input field, the function “updateSuggestion” is called, which updates the suggested text in the background of input field.
   */
   onInput(): void {
    this.searchResult = [];
    this.updateSearchResult();
  }

  getUserName(user: UserInterface): string {
    const foundUser = this.storage.user.find(u => u.id === user.id);
    return foundUser ? (foundUser.id === this.storage.currentUser.id ? `${foundUser.name} (Du)` : foundUser.name) : 'Unbekannt';
  }

  findAvatar(user: UserInterface): string {
    const avatar = this.storage.user.find(u => u.id === user.id)?.avatar || '';
    return avatar.startsWith('profile-')
      ? `assets/img/profile-pictures/${avatar}`
      : this.cloud.openImage(avatar);
  }
  

  channelName(): string {
    return (
      this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.name || ''
    );
  }

  updateSearchResult() {
    const trimmedInput = this.userInput.trim();
    
    if (!trimmedInput) {
      this.searchResult = [];
      return;
    }
  
    const searchTerm = trimmedInput.toLowerCase();
    this.searchResult = this.storage.user.filter(user => {
      return (
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    });
  }

  markUser(user: UserInterface) {
    this.addedUser.push(user);
  }
}
