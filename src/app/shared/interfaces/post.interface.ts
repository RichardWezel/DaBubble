import { EmoticonsInterface } from "./emoticons.interface";

/**
 * A single message. Lives as its own document under
 * `channel/{id}/posts` or `dm/{id}/posts`; thread replies live one level
 * deeper under `.../posts/{postId}/thread`.
 *
 * `threadCount` and `lastThreadTimestamp` are denormalised onto the parent so
 * the message list can show "3 Antworten - letzte Antwort 14:05" without
 * reading the thread subcollection for every message.
 */
export interface PostInterface {
  id: string,
  text: string,
  author: string,
  timestamp: number,
  emoticons?: EmoticonsInterface[],
  threadCount?: number,
  lastThreadTimestamp?: number | null,
  isSeed?: boolean,
  /** Set on the welcome message, the one post that does not expire. */
  isWelcome?: boolean,
}
