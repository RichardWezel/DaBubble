import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { FirebaseStorageService } from './firebase-storage.service';
import { doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CurrentUserInterface } from '../interfaces/current-user-interface';
import { FirebaseError } from '@angular/fire/app';


@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  storage = inject(FirebaseStorageService);
  auth = inject(Auth);
  router = inject(Router);
  errorMessage: string = '';

  onlineTimer: any = null;


  /**
   * Initializes a new instance and checks if an authentication UID is present in the session storage.
   * If an autehntication UID is found, it sets the 'authUid' in the storage and retrieves the current user.
   */
  constructor() {
    if (sessionStorage.getItem("authUid")) {
      this.storage.authUid = sessionStorage.getItem("authUid") || '';
      this.getCurrentUser();
    }
  }


  /**
   * Logs the user in as a guest by setting a predefined authentication UID in session storage and the storage service.
   * Updates the current user information and navigates to the workspace route with a reload option.
   */
  async guestLogin() {
    sessionStorage.setItem("authUid", 't3O7pW0P7QrjD26Bd6DZ');
    this.storage.authUid = 't3O7pW0P7QrjD26Bd6DZ';
    await this.getCurrentUser();
    this.router.navigate(['/workspace'], { reload: true } as any);
  }


  /**
   * Logs the user in via Google Auth.
   * If the user has not registered before, a new user document is created.
   * If the user has registered before, the user document is updated.
   * After a successful login, the user is navigated to the workspace route.
   */
  async googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const result = signInWithPopup(this.auth, provider);
      const user = (await result).user;
      const userDocRef = doc(this.storage.firestore, 'user', user.uid);
      const docSnapshot = await getDoc(userDocRef);
      if (!docSnapshot.exists()) await this.loginWithGoogleNewUser(user);
      else this.loginWithGoogleExistingUser(user);
      this.router.navigate(['/workspace']);
      this.errorMessage = '';
    } catch (error) {
      this.processGoogleLoginError(error);
    }
  }


  /**
   * Processes the Google Login errors.
   * It differs between the Firebase errors and other errors.
   * @param error - The error object that occured during the Google Login process.
   */
  processGoogleLoginError(error: any) {
    if (error instanceof FirebaseError) {
      this.getGoogleLoginErrorMessage(error);
    } else {
      console.error('Unexpected error:', error);
    }
  }


  /**
   * Displays the appropriate error message for the Google Login based on the Firebase error.
   * @param error - The Firebase error object containing details about the login failure.
   */
  getGoogleLoginErrorMessage(error: FirebaseError) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        this.errorMessage = 'Das Anmelde-Popup wurde geschlossen, bevor die Anmeldung abgeschlossen werden konnte.';
        break;
      case 'auth/network-request-failed':
        this.errorMessage = 'Netzwerkproblem! Bitte überprüfe deine Internetverbindung.';
        break;
      default:
        this.errorMessage = 'Fehler bei der Anmeldung mit Google. Bitte versuche es später erneut.';
    }
  }



  /**
   * Logs the user in via Google Auth, creates a new user document in Firestore
   * and adds the user to the storage service.
   * @param user - The user object returned by the authentication process.
   */
  async loginWithGoogleNewUser(user: any) {
    const userData = this.generateUserData(user);
    await this.storage.addUser(user.uid, userData);
    await this.loginWithGoogleExistingUser(user);
  }


  /**
   * Generates user data for the user document in Firestore from the user object returned by the Google login process.
   * @param user - The user object returned by the Google login process.
   * @returns The user data object to be stored in Firestore.
   */
  generateUserData(user: any) {
    return {
      name: user.displayName ?? '',
      email: user.email ?? '',
      avatar: user.photoURL ?? '',
    };
  }


  /**
   * Logs in an existing user via Google Auth by setting the user's UID in session storage 
   * and updating the FirebaseStorageService. Fetches the current user data and sets the user's 
   * status to online in Firestore.
   * @param user - The user object returned by the Google login process.
   */
  async loginWithGoogleExistingUser(user: any) {
    sessionStorage.setItem("authUid", user.uid);
    this.storage.authUid = user.uid;
    await this.getCurrentUser();
  }


  /**
   * Logs out the current user by updating their online status to false and signing out 
   * from the authentication service. Clears local session data and calls functions 
   * to delete local data and set the user offline in the Firestore. Handles errors 
   * during the sign-out process by logging them to the console.
   */
  async logout() {
    const user = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    if (user && user.id) {
      user.online = false;
      await this.setCurrentUserOffline(user.id); // Stelle sicher, dass das Setzen des Status erfolgreich ist
      await signOut(this.auth);
      this.deleteLocalData();
    }
  }


  /**
   * Clears all local session data and unsubscribes from active Firestore snapshots, 
   * sets the user offline, and navigates to the login page after a successful logout.
   */
  deleteLocalData() {
    sessionStorage.clear();
    this.storage.authUid = '';
    this.router.navigate(['/login']);
  }


  /**
   * Sets the online status of the given user in Firestore.
   * @param userId - The ID of the user whose online status is to be set.
   * @param isOnline - Whether the user is online (true) or offline (false).
   */
  async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required to set online status.');
    }
    const user = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    const userDocRef = doc(this.storage.firestore, 'user', userId);
    if (!user) return;
    user.online = isOnline;
    await updateDoc(userDocRef, { online: isOnline })
    this.onlineStatusTimer(isOnline);
  }


  /**
   * Sets a timer to auto-log out the user if the online status is true and they have not
   * interacted with the application for 15 minutes (900000 ms). If the online status is false,
   * the timer is cleared. This method is used to maintain the online status of the user in the
   * Firestore database.
   * @param status - Whether the user is online (true) or offline (false).
   */
  async onlineStatusTimer(status: boolean) {
    if (!this.storage.currentUser.id) return;
    if (this.onlineTimer) clearTimeout(this.onlineTimer);
    if (status) this.onlineTimer = setTimeout(async () => {
      this.logout();
      this.onlineTimer = null;
    }, 900000);
    else this.onlineTimer = null;
  }



  /**
   * Sets the online status of the given user in Firestore to true.
   * @param userId - The ID of the user whose online status is to be set.
   */
  async setCurrentUserOnline(userId: string): Promise<void> {
    await this.setUserOnlineStatus(userId, true);
  }


  /**
   * Sets the online status of the given user in Firestore to false.
   * @param userId - The ID of the user whose online status is to be set.
   */
  async setCurrentUserOffline(userId: string): Promise<void> {
    await this.setUserOnlineStatus(userId, false);
  }


  /**
   * Retrieves the current user's data from Firestore and updates the local storage with the user information.
   * Sets up a snapshot listener on the user's document to handle real-time updates.
   * Calls `finalizeCurrentUser` if the user ID is successfully retrieved.
   * Logs an error to the console if there is an issue fetching the snapshot.
   */
  async getCurrentUser() {
    this.storage.doneLoading = false;
    const userDocRef = doc(this.storage.firestore, "user", this.storage.authUid);
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      let userData = this.extractUserData(docSnapshot);
      this.storage.currentUser = userData;
      this.finalizeCurrentUser();
    } else {
      console.error("User nicht gefunden");
    }
  }


  /**
   * Extracts user data from a Firestore snapshot and assigns the document ID.
   * Sets `currentChannel` based on user data and the current channel stored in the service.
   * Sets `threadOpen` and `postId` based on the current user stored in the service.
   * @param snapshot - The Firestore document snapshot.
   * @returns The extracted user data as a CurrentUserInterface object.
   */
  extractUserData(snapshot: any): CurrentUserInterface {
    let userData = snapshot.data() as CurrentUserInterface;
    userData.id = snapshot.id;
    userData.currentChannel = this.storage.determineCurrentChannel(userData);
    userData.threadOpen = this.storage.currentUser.threadOpen || false;
    userData.postId = this.storage.currentUser.postId || '';
    return userData;
  }


  /**
   * Called when the current user is successfully retrieved from Firestore.
   * Sets the current user's online status to true in Firestore.
   * Retrieves the current user's channels from Firestore and updates the local channel array.
   * Logs an error to the console if setting the user online fails.
   */
  async finalizeCurrentUser() {
    try {
      await this.setCurrentUserOnline(this.storage.currentUser.id!);
      this.storage.getCurrentUserChannelCollection();
    } catch (error) {
      console.error(`Error setting user ${this.storage.currentUser.id} online:`, error);
    }
  }

}
