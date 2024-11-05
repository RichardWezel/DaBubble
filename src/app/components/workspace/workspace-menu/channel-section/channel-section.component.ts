import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component  } from '@angular/core';

@Component({
  selector: 'app-channel-section',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent {

  channels: string[] = ['Entwicklerteam', 'Marketing', 'Vertrieb', 'Support'];

  // Statusvariable zur Steuerung der Sichtbarkeit
  isListVisible: boolean = true;

  // Methode zum Umschalten des Status
  toggleList() {
    this.isListVisible = !this.isListVisible;
  }
}
