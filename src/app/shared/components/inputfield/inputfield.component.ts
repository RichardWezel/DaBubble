import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { PostInterface } from '../../interfaces/post.interface';
import { UidService } from '../../services/uid.service';

@Component({
  selector: 'app-inputfield',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inputfield.component.html',
  styleUrl: './inputfield.component.scss'
})
export class InputfieldComponent {
  storage = inject(FirebaseStorageService);
  uid = inject(UidService);

  src = 'assets/icons/send.svg';
  message: string = '';

  constructor() { }

  sendMessage() {
    if (!this.message) return;
    let newPost: PostInterface = {
      text: this.message,
      timestamp: new Date().getTime(),
      author: this.storage.currentUser.id || '',
      id: this.uid.generateUid(),
      thread: false,
      emoticons: [],
      threadMsg: [],
    };

    if (this.isChannel() && this.storage.currentUser.currentChannel) {
      this.storage.writePosts(this.storage.currentUser.currentChannel, newPost);
    }
    this.message = '';
  }

  isChannel() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
  }
}


