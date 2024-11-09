import { EmoticonsInterface } from "./emoticons.interface";

export interface PostInterface {
  text: string,
  author: string,
  timestamp: number,
  thread: boolean,
  id: string,
  emoticons?: EmoticonsInterface[],
  threadMsg?: PostInterface[],
}
