import { Component, inject } from '@angular/core';
import { OpenNewMessageService } from '../../../../shared/services/open-new-message.service';
import { FirebaseStorageService } from '../../../../shared/services/firebase-storage.service';

@Component({
  selector: 'app-head-section',
  standalone: true,
  imports: [],
  templateUrl: './head-section.component.html',
  styleUrl: './head-section.component.scss'
})
export class HeadSectionComponent {

  storage = inject(FirebaseStorageService);

  constructor(private openNewMessageService: OpenNewMessageService) {}

  openNewMessage() {
    this.openNewMessageService.triggerNewMessage();
  }

}
