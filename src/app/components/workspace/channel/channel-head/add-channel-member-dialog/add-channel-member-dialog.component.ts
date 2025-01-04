import { NgFor, NgIf, NgStyle } from '@angular/common';
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
  imports: [NgFor, NgIf, FormsModule, NgStyle],
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
  isLoading: boolean = false; // Neue Eigenschaft für Ladezustand
  errorMessage: string = ''; // Neue Eigenschaft für Fehlermeldungen
  successMessage: string = ''; // Neue Eigenschaft für Erfolgsmeldungen

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
    // Optional: Reset messages und addedUser beim Schließen des Dialogs
    this.errorMessage = '';
    this.successMessage = '';
    this.addedUser = [];
    this.userInput = '';
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
    if (!this.addedUser.find(u => u.id === user.id)) { // Verhindert doppelte Einträge
      this.addedUser.push(user);
    }
    this.userInput = "";
    this.errorMessage = ''; // Reset Fehlermeldung bei erfolgreicher Auswahl
  }

  /**
   * Fügt alle hinzugefügten Benutzer zum aktuellen Channel hinzu.
   */
  async addUsers() {
    if (this.addedUser.length === 0) {
      this.errorMessage = 'Es wurden keine Benutzer zum Hinzufügen ausgewählt.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const currentChannelId = this.storage.currentUser.currentChannel;
      if (!currentChannelId) {
        throw new Error('Aktueller Channel nicht gefunden.');
      }

      // Extrahieren Sie die Benutzer-IDs aus addedUser
      const newUserIds = this.addedUser.map(user => user.id!).filter(id => !!id);

      // Rufen Sie die Service-Methode auf, um die Benutzer zum Channel hinzuzufügen
      await this.storage.addUsersToChannel(currentChannelId, newUserIds);

      this.successMessage = 'Benutzer erfolgreich hinzugefügt!';
      // Optional: Aktualisieren Sie die channelUsers-Eingabe, falls sie vom Parent-Component kommt
      this.channelUsers = [...this.channelUsers, ...newUserIds];

      // Optional: Leeren Sie die addedUser-Liste und das Eingabefeld
      this.addedUser = [];
      this.userInput = '';
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen der Benutzer:', error);
      this.errorMessage = error.message || 'Beim Hinzufügen der Benutzer ist ein Fehler aufgetreten.';
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Entfernt einen Benutzer aus der addedUser-Liste.
   * @param user - Der Benutzer, der entfernt werden soll.
   */
  removeUser(user: UserInterface): void {
    this.addedUser = this.addedUser.filter(u => u.id !== user.id);
  }

}
