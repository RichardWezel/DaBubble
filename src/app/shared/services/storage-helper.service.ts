import { Injectable } from '@angular/core';
import { PostInterface } from '../interfaces/post.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { UserInterface } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageHelperService {

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
      },],
    };

  }
}
