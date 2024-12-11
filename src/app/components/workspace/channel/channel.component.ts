import { Component, inject } from '@angular/core';
import { ChannelHeadComponent } from "./channel-head/channel-head.component";
import { InputfieldComponent } from "../../../shared/components/inputfield/inputfield.component";
import { ChannelMessagesComponent } from "./channel-messages/channel-messages.component";
import { FirebaseStorageService } from '../../../shared/services/firebase-storage.service';
import { SearchComponent } from '../navbar/search/search.component';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [ChannelHeadComponent, InputfieldComponent, ChannelMessagesComponent, SearchComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  storage = inject(FirebaseStorageService);


  constructor() { }



}
