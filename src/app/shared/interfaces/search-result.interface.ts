import { ChannelInterface } from "./channel.interface";
import { UserInterface } from "./user.interface";
import { PostInterface } from "./post.interface";

export interface SearchResultChannel {
    type: 'channel';
    channel: ChannelInterface;
  }
  
  export interface SearchResultUser {
    type: 'user';
    user: UserInterface;
  }
  
  export interface SearchResultChannelPost {
    type: 'channel-post';
    channel: ChannelInterface;
    post: PostInterface;
  }
  
  export type SearchResult = SearchResultChannel | SearchResultUser | SearchResultChannelPost;
  
