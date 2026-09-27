import { inject, Injectable } from '@angular/core';
import { ChannelInterface } from '../interfaces/channel.interface';
import { UserInterface } from '../interfaces/user.interface';
import { PostInterface } from '../interfaces/post.interface';
import { UidService } from './uid.service';
import { SECOND_DM_CONTACT_ID, WELCOME_DM_SENDER_ID } from '../../../config/seed-ids';
import type { FirebaseStorageService } from './firebase-storage.service';

@Injectable({
  providedIn: 'root'
})
export class StorageHelperService {
  uid = inject(UidService);

  constructor() { }


  /**
   * Builds a new channel document. Messages are not part of it - they live in
   * the posts subcollection.
   * @param channelData - name, description and owner of the channel
   */
  generateChannel(channelData: { name: string, description: string, owner: string }): ChannelInterface {
    return {
      type: 'channel',
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: [channelData.owner],
      isSeed: false,
    };
  }


  /**
   * Builds a new user document.
   * @param userData - name, email and avatar of the user
   */
  generateUser(userData: { name: string, email: string, avatar: string }): UserInterface {
    return {
      type: 'user',
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      online: false,
      isSeed: false,
    };
  }


  /**
   * Gives a freshly registered user the conversations they start with: one
   * with themselves for notes, one carrying the welcome message, and one with
   * the second contact.
   * @param storage - the storage service, passed in to avoid a circular injection
   * @param authUid - the new user's id
   * @param name - the new user's display name, used in the welcome message
   */
  async createStarterDms(storage: FirebaseStorageService, authUid: string, name: string): Promise<void> {
    await storage.ensureDm(authUid, authUid);
    await storage.ensureDm(authUid, SECOND_DM_CONTACT_ID);

    const welcomeDmId = await storage.ensureDm(authUid, WELCOME_DM_SENDER_ID);
    await storage.addWelcomePost(welcomeDmId, this.generateWelcomePost(name));
  }


  /**
   * The welcome message a new user finds in their inbox. Unlike everything
   * else a client writes, this one does not expire - see
   * FirebaseStorageService.addWelcomePost.
   * @param name - the new user's display name
   */
  generateWelcomePost(name: string): PostInterface {
    return {
      id: this.uid.generateUid(),
      isWelcome: true,
      author: WELCOME_DM_SENDER_ID,
      timestamp: Date.now(),
      emoticons: [],
      text: `<h3>🎉 Willkommen in unserem Team, ${name}!</h3>
        <p>Wir freuen uns, dass du uns beigetreten bist. Wir warten auf dich und freuen uns auf deine erste Nachricht!</p><br>
        <p>🚀 Erste Schritte:</p>
        <ul>
        <li>Stöbere durch die #Testchannel oder #Lobby, um dich vorzustellen.</li>
        <li>Passe dein Profil unter Einstellungen → Profil an.</li>
        </ul><br>
        <p>Brauchst du Hilfe? Schreib einfach in #Lobby oder sende mir eine direkte Nachricht.</p><br>
        <p>Viel Spaß beim Vernetzen!</p><br>
        <p>Dein <b>DA Bubble-Team</b> 🌟</p>
        `,
    };
  }
}
