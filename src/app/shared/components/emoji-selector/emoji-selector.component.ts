import { Component, inject, Injectable, Input } from '@angular/core';
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
@Injectable({
  providedIn: 'root'
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
    this.inputField?.addEmoji(event.emoji.native);
  }

  addEmojiToReaction(event: any) {
    if (this.origin === '' || this.post.id === '') {
      this.origin = event.emoji.origin;
      this.post = event.emoji.post;
      this.isThread = event.emoji.isThread;
    };
    let react: EmoticonsInterface = this.generateReaction(event);
    this.searchCurrentReaction(event, react);
    this.postReaction(event);
  }


  generateReaction(event: any) {
    return {
      type: event.emoji.native,
      name: [this.storage.currentUser?.id ?? ''],
      count: 1
    }
  }

  searchCurrentReaction(event: any, react: EmoticonsInterface) {
    if (!this.storage.currentUser.id) return;
    if (this.post.emoticons) {
      let emote = this.post.emoticons.find(emote => emote.type === event.emoji.native);
      if (emote?.name.includes(this.storage.currentUser?.id)) {
        emote.count -= 1;
        emote.name.splice(emote.name.indexOf(this.storage.currentUser?.id), 1);
        if (emote.count === 0) this.post.emoticons.splice(this.post.emoticons.indexOf(emote), 1);
      } else if (emote) {
        emote.count += 1;
        emote.name.push(this.storage.currentUser?.id);
      } else {
        this.post.emoticons.push(react);
      }
    } else {
      this.post.emoticons = [react];
    };
  }


  postReaction(event: any) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let currentPost = posts?.find(post => post.id === this.storage.currentUser.postId);
    let curUser = this.storage.user.find(user => user.id === this.storage.currentUser.id);
    let currentDm = curUser?.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
    let dmPost = currentDm?.posts?.find(post => post.id === this.storage.currentUser.postId);
    switch (true) {
      case this.isThread && this.origin === 'channel':
        let threadMsg = currentPost?.threadMsg?.find(thread => thread.id === this.post.id);
        if (threadMsg) threadMsg.emoticons = this.post.emoticons;
        this.storage.updateChannelPost(this.storage.currentUser.currentChannel, this.storage.currentUser.postId!, currentPost!);
        break;
      case this.isThread && this.origin === 'dm':
        let dmThreadMsg = dmPost?.threadMsg?.find(thread => thread.id === this.post.id);
        if (dmThreadMsg) dmThreadMsg.emoticons = this.post.emoticons;
        this.storage.updateDmPost(this.storage.currentUser.id, currentDm?.contact!, this.storage.currentUser.postId!, dmPost!);
        break;
      case !this.isThread && this.origin === 'channel':
        currentPost = posts?.find(post => post.id === this.post.id);
        if (currentPost) currentPost.emoticons = this.post.emoticons;
        this.storage.updateChannelPost(this.storage.currentUser.currentChannel, this.post.id, currentPost!);
        break;
      case !this.isThread && this.origin === 'dm':
        console.log(this.storage.currentUser.id);
        dmPost = currentDm!.posts?.find(post => post.id === this.post.id);
        if (dmPost) dmPost.emoticons = this.post.emoticons;
        this.storage.updateDmPost(this.storage.currentUser.id, currentDm?.contact!, this.post.id, dmPost!);
        break;
    }
    if (event.emoji.post || event.emoji.isThread) {
      this.post = { text: '', author: '', timestamp: 0, thread: false, id: '' };
      this.origin = '';
      this.isThread = false;
    }
  }



}
