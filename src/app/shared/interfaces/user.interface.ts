import { PostInterface } from "./post.interface";

export interface UserInterface {
  type: 'user'; // Typen-Discriminator
  name: string,
  email: string,
  avatar: string,
  online: boolean,
  dm: { contact: string, id: string, posts: PostInterface[] }[];
  id?: string
}