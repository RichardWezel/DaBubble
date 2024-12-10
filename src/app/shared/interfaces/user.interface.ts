import { PostInterface } from "./post.interface";

export interface UserInterface {
  name: string,
  email: string,
  avatar: string,
  online: boolean,
  dm: { contact: string, id: string, posts: PostInterface[] }[];
  id?: string
}