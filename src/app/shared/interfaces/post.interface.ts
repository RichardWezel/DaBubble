import { EmoticonsInterface } from "./emoticons.interface";

export interface PostInterface {
  text: string,
  author: string,
  timestamp: number,
  thread: boolean,
  emoticons?: EmoticonsInterface[],
  threadMsg?: PostInterface[],
}
