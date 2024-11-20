import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { InputfieldComponent } from '../inputfield/inputfield.component';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { EmoticonsInterface } from '../../interfaces/emoticons.interface';
import { PostInterface } from '../../interfaces/post.interface';


@Component({
  selector: 'app-emoji-selector',
  standalone: true,
  imports: [FormsModule, PickerModule],
  templateUrl: './emoji-selector.component.html',
  styleUrl: './emoji-selector.component.scss'
})
export class EmojiSelectorComponent {
  storage = inject(FirebaseStorageService);
  message: string = '';
  @Input() inputField?: InputfieldComponent;
  @Input() isInput: boolean = false;
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() origin: string = '';
  @Input() isThread: boolean = false;


  constructor() { }

  addEmojiToMessage(event: any) {
    this.message += event.emoji.native;
    this.inputField?.addEmoji(event.emoji.native);
  }

  addEmojiToReaction(event: any) {
    let react: EmoticonsInterface = {
      type: event.emoji.native,
      name: [this.storage.currentUser?.id ?? ''],
      count: 1
    };
    let newPost = this.storage.channel.find(channel => channel.id === this.storage.currentUser?.currentChannel)?.posts?.find(post => post.id === this.storage.currentUser?.postId);
    if (!newPost) return;
    if (!newPost.emoticons) newPost.emoticons = [react];
    else {
      let found = newPost.emoticons.find(emoticon => emoticon.type === event.emoji.native);
      if (found) found.count++;
      else newPost.emoticons.push(react);
    }



  }
}
