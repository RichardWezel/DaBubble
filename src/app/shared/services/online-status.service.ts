import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

/**
 * Service to manage the online status of users in Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class OnlineStatusService {

  /**
   * Creates an instance of OnlineStatusService.
   * @param firestore - Firestore instance for interacting with the database.
   */
  constructor(private firestore: Firestore) { }

  /**
   * Sets the 'online' status of a user.
   * @param userId - The ID of the user whose status is to be updated.
   * @param isOnline - The online status to set (true or false).
   * @returns A promise that resolves when the update is complete.
   */
  async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required to set online status.');
    }

    const userDocRef = doc(this.firestore, 'user', userId);
    try {
      await updateDoc(userDocRef, { online: isOnline });
      // console.log(`User ${userId} online status set to ${isOnline}`);
    } catch (error) {
      console.error(`Error setting online status for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Sets the current user's online status to true.
   * @param userId - The ID of the current user.
   * @returns A promise that resolves when the update is complete.
   */
  async setCurrentUserOnline(userId: string): Promise<void> {
    return this.setUserOnlineStatus(userId, true);
  }

  /**
   * Sets the current user's online status to false.
   * @param userId - The ID of the current user.
   * @returns A promise that resolves when the update is complete.
   */
  async setCurrentUserOffline(userId: string): Promise<void> {
    return this.setUserOnlineStatus(userId, false);
  }
}
