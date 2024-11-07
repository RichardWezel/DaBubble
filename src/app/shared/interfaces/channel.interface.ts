import { PostInterface } from "./post.interface";

export interface ChannelInterface {
  name: string,
  description: string,
  users: string[],
  owner: string,
  status?: string,
  posts?: PostInterface[],
  id?: string
}
