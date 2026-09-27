// search-result.interface.ts

import { ChannelInterface } from "./channel.interface";
import { UserInterface } from "./user.interface";
import { PostInterface } from "./post.interface";

/**
 * Base interface for search results.
 */
export interface BaseSearchResult {
  type: 'channel' | 'user' | 'channel-post' | 'thread';
}

/**
 * Interface for channel search results.
 */
export interface SearchResultChannel extends BaseSearchResult {
  type: 'channel';
  channel: ChannelInterface;
}

/**
 * Interface for user search results.
 */
export interface SearchResultUser extends BaseSearchResult {
  type: 'user';
  user: UserInterface;
}

/**
 * Interface for channel post search results.
 */
export interface SearchResultChannelPost extends BaseSearchResult {
  type: 'channel-post';
  channel: ChannelInterface;
  post: PostInterface;
}

/**
 * Interface for thread search results.
 */
export interface SearchResultThread extends BaseSearchResult {
  type: 'thread';
  parentType: 'channel' | 'dm';
  /** Id of the channel or direct message the thread lives in. */
  parentId: string;
  /** Id of the post the thread hangs off - taken from the document path. */
  parentPostId: string;
  thread: PostInterface;
}

/**
 * Union type for all search results.
 */
export type SearchResult = SearchResultChannel | SearchResultUser | SearchResultChannelPost | SearchResultThread;
