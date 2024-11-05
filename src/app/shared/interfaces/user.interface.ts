import { PostInterface } from "./post.interface";

export interface UserInterface {
  name: string,
  email: string,
  avatar: string,
  status: string,
  dm: { contact: string, post: PostInterface[] }[];
  id?: string
}
