import { UserInterface } from "./user.interface";

export interface CurrentUserInterface extends UserInterface {
  currentChannel?: string;
  currentChannelName?: string;
}
