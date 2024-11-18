import { Component } from '@angular/core';
import { OpenNewMessageService } from '../../../../shared/services/open-new-message.service';

@Component({
  selector: 'app-head-section',
  standalone: true,
  imports: [],
  templateUrl: './head-section.component.html',
  styleUrl: './head-section.component.scss'
})
export class HeadSectionComponent {

  constructor(private openNewMessageService: OpenNewMessageService) {}

  openNewMessage() {
    this.openNewMessageService.triggerNewMessage();
  }

}
