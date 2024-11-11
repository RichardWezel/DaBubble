import { Component } from '@angular/core';
import { ChannelHeadComponent } from "./channel-head/channel-head.component";
import { InputfieldComponent } from "../../../shared/components/inputfield/inputfield.component";
import { ChannelMessagesComponent } from "./channel-messages/channel-messages.component";

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [ChannelHeadComponent, InputfieldComponent, ChannelMessagesComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {


  constructor() { }

}
