import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class OpenCloseDialogService {

  private dialogs: { [key: string]: BehaviorSubject<boolean> } = {
    userProfile: new BehaviorSubject<boolean>(false),
    channelMember: new BehaviorSubject<boolean>(false),
    workspaceMenu: new BehaviorSubject<boolean>(true),
    addChannelMember: new BehaviorSubject<boolean>(false),
    addChannel: new BehaviorSubject<boolean>(false),
    SelectionOfAddingChannelMembers: new BehaviorSubject<boolean>(false),
  };

  profileId = new EventEmitter<string>();

  constructor() { }


  /**
   * Method to open a dialog.
   * @param dialogName - The name of the dialog.
   */
  open(dialogName: string): void {
    const dialog = this.dialogs[dialogName];
    if (dialog) {
      dialog.next(true);
    } else {
      console.warn(`Dialog mit dem Namen "${dialogName}" existiert nicht.`);
    }
  }


  /**
   * Method to close a dialog.
   * @param dialogName - The name of the dialog.
   */
  close(dialogName: string): void {
    const dialog = this.dialogs[dialogName];
    if (dialog) {
      dialog.next(false);
    } else {
      console.warn(`Dialog mit dem Namen "${dialogName}" existiert nicht.`);
    }
  }


  /**
   * Observable to subscribe the dialog status-
   * @param dialogName - The name of the dialog.
   * @returns - An Observable<boolean> that emits the open/close status of the dialog if it exists.
   *          - 'null' if no dialog with the given name is found.
   */
  isDialogOpen(dialogName: string): Observable<boolean> | null {
    const dialog = this.dialogs[dialogName];
    if (dialog) {
      return dialog.asObservable();
    }
    console.warn(`Dialog mit dem Namen "${dialogName}" existiert nicht.`);
    return null;
  }


  /**
   * Emits the new profile ID to the profileId EventEmitter.
   * @param userID The new profile ID to emit.
   */
  changeProfileId(userID: string) {
    this.profileId.emit(userID);
  }
}