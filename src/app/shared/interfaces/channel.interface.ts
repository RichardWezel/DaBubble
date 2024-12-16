import { PostInterface } from "./post.interface";

export interface ChannelInterface {
  type: 'channel'; // Typen-Discriminator
  name: string,
  description: string,
  user: string[],
  owner: string,
  posts?: PostInterface[],
  id?: string
}
