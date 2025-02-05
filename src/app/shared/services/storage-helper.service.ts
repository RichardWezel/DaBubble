import { inject, Injectable } from '@angular/core';
import { PostInterface } from '../interfaces/post.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { UserInterface } from '../interfaces/user.interface';
import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class StorageHelperService {
  uid = inject(UidService);

  constructor() { }


  /**
   * Creates a new post with the same properties as the given post, but with new text, emoticons, threadMsg, and thread properties.
   * @param post - The post to clone.
   * @param newPost - The new post properties.
   * @returns The new post with the same properties as the given post, but with the new properties.
   */
  generatePost(post: PostInterface, newPost: PostInterface): PostInterface {
    post.text = newPost.text;
    post.emoticons = newPost.emoticons;
    post.threadMsg = newPost.threadMsg;
    post.thread = newPost.thread;
    return post;
  }


  /**
   * Generates a new DM object with the contact and ID specified, and an empty posts array.
   * @param contact - The ID of the contact for the DM.
   * @param uid - The ID of the DM.
   * @returns The new DM object.
   */
  generateDM(contact: string, uid: string, newPost?: PostInterface): { contact: string, id: string, posts: any[] } {
    if (!newPost) return { contact: contact, id: uid, posts: [] };
    else return { contact: contact, id: uid, posts: [newPost] };
  }


  /**
   * Generates a new Channel object based on the given channel data, which must contain 'name', 'description', and 'owner' properties.
   * The generated Channel has a type of 'channel', the given name and description, the given owner as the first user, and an empty posts array.
   * @param channelData - The object containing the name, description, and owner of the channel to generate.
   * @returns The generated Channel object.
   */
  generateChannel(channelData: any): ChannelInterface {
    return {
      type: 'channel',
      name: channelData.name,
      description: channelData.description,
      owner: channelData.owner,
      user: [channelData.owner],
      posts: [],
    };
  }


  /**
   * Generates a new User object based on the given user data, which must contain 'name', 'email', and 'avatar' properties.
   * The generated User has a type of 'user', the given name, email, and avatar, and an empty DM array except for the provided authUid.
   * @param authUid - The ID of the user that is authenticated.
   * @param userData - The object containing the name, email, and avatar of the user to generate.
   * @param uid - The ID of the user dm to generate.
   * @returns The generated User object.
   */
  generateUser(authUid: string, userData: any, uid: string): UserInterface {
    return {
      type: 'user',
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      online: false,
      dm: [{
        contact: authUid,
        id: uid,
        posts: [],
      },
      this.generateNewUserDM('vGSV3WkolpaARg1JP13q', true, userData.name),
      this.generateNewUserDM('Z6y2sAEfa4oUXENZHFC3', false, userData.name),
      ],
    };
  }


  /**
   * Generates a new DM with the given contact, or a new user welcome message if `post` is true.
   * The generated DM has a contact of the given `contact`, a new ID, and an empty posts array except for the welcome message if `post` is true.
   * @param contact - The ID of the contact to generate the DM for.
   * @param post - Whether to generate a new user welcome message or not.
   * @param name - The name of the new user to welcome.
   * @returns The generated DM object.
   */
  generateNewUserDM(contact: string, post: boolean = false, name: string): { contact: string, id: string, posts: any[] } {
    return {
      contact: contact,
      id: this.uid.generateUid(),
      posts: post ? [{
        author: contact,
        emoticons: [],
        id: this.uid.generateUid(),
        text: `<h3>🎉 Willkommen in unserem Team, ${name}!</h3>
        <p>Wir freuen uns, dass du uns beigetreten bist. Wir warten auf dich und freuen uns auf deine erste Nachricht!</p><br>
        <p>🚀 Erste Schritte:</p>
        <ul>
        <li>Stöbere durch die #Testchannel oder #Lobby, um dich vorzustellen.</li>
        <li>Passe dein Profil unter Einstellungen → Profil an.</li>
        </ul><br>
        <p>Brauchst du Hilfe? Schreib einfach in #Lobby oder sende mir eine direkte Nachricht.</p><br>
        <p>Viel Spaß beim Vernetzen!</p><br>
        <p>Dein <b>DA Bubble-Team</b> 🌟</p>
        ` ,
        thread: false,
        threadMsg: [],
        timestamp: new Date().getTime(),
      },
      ] : [],
    };
  }


  /**
   * Retrieves all threads from the user's channels.
   * @param channels - The array of channels from the user.
   * @returns An array of objects, where each object contains a thread and a parent.
   */
  getThreadsFromChannels(channels: ChannelInterface[]): { thread: PostInterface, parent: ChannelInterface }[] {
    const threads: { thread: PostInterface, parent: ChannelInterface }[] = [];
    channels.forEach(channel => {
      channel.posts?.forEach(post => {
        if (post.thread && post.threadMsg) {
          threads.push(...post.threadMsg.map(threadPost => ({ thread: threadPost, parent: channel })));
        }
      });
    });
    return threads;
  }


  /**
   * Retrieves all threads from the user's direct messages.
   * @param dms - The array of direct messages from the user.
   * @param currentUser - The user object of the current user.
   * @returns An array of objects, where each object contains a thread and a parent.
   */
  getThreadsFromDirectMessages(dms?: UserInterface['dm'], currentUser?: UserInterface): { thread: PostInterface, parent: UserInterface }[] {
    const threads: { thread: PostInterface, parent: UserInterface }[] = [];
    dms?.forEach(dm => {
      dm.posts.forEach(post => {
        if (post.thread && post.threadMsg) {
          threads.push(...post.threadMsg.map(threadPost => ({ thread: threadPost, parent: currentUser! })));
        }
      });
    });
    return threads;
  }
}
