import { Component, inject, Input } from '@angular/core';
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

  @Input() thread: boolean = false;

  src = 'assets/icons/send.svg';
  message: string = '';

  constructor() { }

  sendMessage() {
    if (!this.message || !this.storage.currentUser.id || !this.storage.currentUser.currentChannel) return;
    let newPost: PostInterface = {
      text: this.message,
      timestamp: new Date().getTime(),
      author: this.storage.currentUser.id || '',
      id: this.uid.generateUid(),
      thread: false,
      emoticons: [],
      threadMsg: [],
    };
    if (this.thread) {
      if (this.isChannel()) {
        let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
        let post = posts?.find(post => post.id === this.storage.currentUser.postId);
        if (post && this.storage.currentUser.postId) {
          post.thread = true;
          post.threadMsg?.push(newPost);
          this.storage.updateChannelPost(this.storage.currentUser.currentChannel, this.storage.currentUser.postId, post);
        }
      } else if (this.isDM()) {

      }
    } else {

      if (this.isChannel()) {
        this.storage.writePosts(this.storage.currentUser.currentChannel, newPost);
      } else if (this.isDM()) {
        this.storage.writeDm(this.storage.currentUser.id, this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', newPost);
        this.storage.writeDm(this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', this.storage.currentUser.id, newPost);
      }
    }
    this.message = '';
  }

  isChannel() {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
  }

  isDM() {
    return this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
  }
}


