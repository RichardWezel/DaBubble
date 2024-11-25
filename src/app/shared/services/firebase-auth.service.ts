import { inject, Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { FirebaseStorageService } from './firebase-storage.service';
import { collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  storage = inject(FirebaseStorageService);
  auth = inject(Auth);
  router = inject(Router);

  constructor() { }


  /**
   * This method logs in a user as a guest by setting a pre-defined UID value in the session storage
   * and the FirebaseStorageService. It activates guest mode, retrieves the current user data from 
   * storage, and navigates the user to the workspace page, reloading it upon navigation.
   */
  guestLogin() {
    sessionStorage.setItem("authUid", 'oYhCXFUTy11sm1uKLK4l');
    this.storage.authUid = 'oYhCXFUTy11sm1uKLK4l';
    console.log('Gast-Login aktiviert.');
    this.storage.getCurrentUser();
    this.router.navigate(['/workspace'], { reload: true } as any);
  }


  /**
   * Initiates a Google login process by using Firebase Authentication with a GoogleAuthProvider.
   * If the user's document does not exist in Firestore, it creates a new user document.
   * Otherwise, it updates the existing user document.
   * Finally, it navigates the user to the workspace page.
   * Logs any errors encountered during the process.
   */
  googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then(async (result) => {
        const user = result.user;
        console.log(result);
        console.log('Google-Benutzer:', user);
        const userDocRef = doc(this.storage.firestore, 'user', user.uid);
        const docSnapshot = await getDoc(userDocRef);
        if (!docSnapshot.exists()) await this.loginWithGoogleNewUser(user, userDocRef);
        else await this.loginWithGoogleExistingUser(user, userDocRef);
        this.router.navigate(['/workspace']);
      })
      .catch((error) => console.error('Fehler beim Google-Login: ', error.message));
  }


  /**
   * Creates a new user document in Firestore with the user's name, email, and avatar.
   * Then, calls loginWithGoogleExistingUser to log in the user.
   * @param user - The user object returned by the Google login process.
   * @param userDocRef - The document reference for the user's document in Firestore.
   */
  async loginWithGoogleNewUser(user: any, userDocRef: any) {
    const userData = this.generateUserData(user);
    await this.storage.addUser(user.uid, userData);
    await this.loginWithGoogleExistingUser(user, userDocRef);
  }


  /**
   * Generates user data object from the given user information.
   * @param user - The user object returned by the authentication process.
   * @returns An object containing the user's name, email, and avatar URL.
   */
  generateUserData(user: any) {
    return {
      name: user.displayName ?? '',
      email: user.email ?? '',
      avatar: user.photoURL ?? '',
    };
  }

  /**
   * Logs in an existing user by setting the user's UID in session storage and the FirebaseStorageService.
   * It retrieves the current user data from storage and updates the user's online status in Firestore.
   * @param user - The user object returned by the Google login process.
   * @param userDocRef - The document reference for the user's document in Firestore.
   */
  async loginWithGoogleExistingUser(user: any, userDocRef: any) {
    sessionStorage.setItem("authUid", user.uid);
    this.storage.authUid = user.uid;
    this.storage.getCurrentUser();
    await updateDoc(userDocRef, { online: true });
  }


  /**
   * Logs out the current user by setting the user's online status to false in Firestore,
   * and then signing out the user from Firebase Authentication.
   * Finally, it removes the user's UID from session storage and the FirebaseStorageService.
   * Logs any errors encountered during the process.
   */
  logout() {
    const user = this.storage.currentUser;
    const userDocRef = doc(collection(this.storage.firestore, 'user'), user.id);
    if (user) {
      updateDoc(userDocRef, { online: false })
        .then(() => console.log(`Benutzer ${user.id} wurde als offline markiert.`))
        .catch((error) => console.error(`Fehler beim Zurücksetzen des Online-Status für ${user.id}:`, error));
    }
    signOut(this.auth)
      .then(() => this.deleteLocalData())
      .catch((error) => console.error('Fehler beim Abmelden:', error));
  }


  /**
   * Clears the session storage and resets the FirebaseStorageService state.
   * Unsubscribes from any active snapshots, resets the authentication UID, 
   * and navigates to the login page. Logs a message indicating successful logout.
   */
  deleteLocalData() {
    console.log('Benutzer erfolgreich abgemeldet.');
    sessionStorage.clear();

    this.storage.unsubscribeSnapshot();
    this.storage.authUid = '';
    this.router.navigate(['/login']);
  }

}
