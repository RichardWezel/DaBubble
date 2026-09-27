/**
 * A channel. Its messages are not part of the document - they live in the
 * `posts` subcollection underneath it.
 */
export interface ChannelInterface {
  type: 'channel',
  name: string,
  description: string,
  user: string[],
  owner: string,
  id?: string,
  isSeed?: boolean,
}
