import { Injectable, inject } from '@angular/core';
import { UserInterface } from '../interfaces/user.interface';
import { FirebaseStorageService } from './firebase-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  protected storage = inject(FirebaseStorageService);
  private userInputSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public userInput$: Observable<string> = this.userInputSubject.asObservable();

  constructor() { }

  /**
   * Finds the ID of the direct message (DM) channel for a given user.
   * Creates a new DM channel if one does not already exist.
   * @param result - The UserInterface object representing the selected user.
   * @returns A promise that resolves to the DM channel ID or undefined.
   */
  async findIdOfDM(result: UserInterface): Promise<string | undefined> {
    const UserMatch = this.storage.user.find(user =>
      user.name.toLowerCase().includes(result.name.toLowerCase())
    );
    if (UserMatch && this.findUserInDms(UserMatch)) {
      return this.getDmContact(UserMatch?.id!);
    } else if (UserMatch && !this.findUserInDms(UserMatch)) {
      return await this.showNewDm(UserMatch);
    } else {
      return this.storage.currentUser.currentChannel;
    }
  }

  /**
  * Checks if a user is already in the current user's direct messages.
  * @param UserMatch - The UserInterface object to check.
  * @returns True if the user is in DMs, false otherwise.
  */
  findUserInDms(UserMatch: UserInterface): boolean {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    return curUser!.dm.some(dm => dm.contact === UserMatch.id);
  }

  /**
   * Retrieves the DM channel ID for a given user ID.
   * @param IdOfUser - The ID of the user.
   * @returns The DM channel ID or undefined if not found.
   */
  getDmContact(IdOfUser: string): string | undefined {
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    const dm = curUser?.dm.find(dm => dm.contact === IdOfUser);
    return dm ? dm.id : undefined;
  }

  /**
   * Creates a new direct message channel with the specified user.
   * @param UserMatch - The UserInterface object representing the user to message.
   * @returns A promise that resolves to the new DM channel ID or undefined.
   */
  async showNewDm(UserMatch: UserInterface): Promise<string | undefined> {
    await this.createEmptyDms(UserMatch);
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let dmWithNewUser = curUser?.dm.find(dm => dm.contact === UserMatch.id);
    if (dmWithNewUser) {
      return dmWithNewUser!.id;
    } else {
      return this.storage.currentUser.currentChannel;
    }
  }

  /**
   * Creates empty DM channels between the current user and the specified user.
   * @param match - The UserInterface object representing the user to message.
   */
  async createEmptyDms(match: UserInterface): Promise<void> {
    let currentUserId = this.storage.currentUser.id;
    let NewUserId = match.id;
    if (currentUserId && NewUserId) {
      await this.storage.createNewEmptyDm(currentUserId, NewUserId);
      await this.storage.createNewEmptyDm(NewUserId, currentUserId);
    }
  }

  /**
   * Setzt den aktuellen Benutzerinput und benachrichtigt alle Abonnenten.
   * @param input - Der neue Benutzerinput.
   */
  setUserInput(input: string): void {
    this.userInputSubject.next(input);
  }
  
  /**
   * Gibt den aktuellen Wert des Benutzerinputs zurück.
   * @returns Der aktuelle Benutzerinput.
   */
  getUserInput(): string {
    return this.userInputSubject.value;
  }
}
