import { NgFor } from '@angular/common';
import { Component  } from '@angular/core';

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgFor],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent {

  channels: string[] = ['Entwicklerteam', 'Marketing', 'Vertrieb', 'Support'];
}
