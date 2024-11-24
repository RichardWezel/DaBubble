import { Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service';
import { User } from '@angular/fire/auth';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { EmojiSelectorComponent } from '../emoji-selector/emoji-selector.component';
import { EmojiComponent, EmojiData, EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';


@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgStyle, EmojiSelectorComponent, EmojiComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit, OnChanges {
  storage = inject(FirebaseStorageService);
  elementRef: ElementRef = inject(ElementRef);
  emojiSelector = inject(EmojiSelectorComponent);
  emoji = inject(EmojiService);
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() threadHead: boolean = false;
  @Input() origin: string = '';
  @Input() isThread: boolean = false;
  authorName: string = '';
  authorAvatar: string = '';
  showEmojiSelector: boolean = false;
  reactSelf: boolean = false;


  isAuthorCurrentUser: boolean = false;

  constructor(private authorService: AuthorService) { }


  outsideClick(event: any) {
    event.stopPropagation();
    const path = event.path || (event.composedPath && event.composedPath());
    if (!path.includes(this.elementRef.nativeElement.querySelector('app-emoji-selector'))) {
      this.showEmojiSelector = false;
    }
  }

  /**
   * Der OnInit-Hook ist nützlich, um eine Methode direkt nach der Initialisierung der Komponente auszuführen.
   */
  ngOnInit() {
    this.resolveAuthor();
    this.updateAuthorStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      this.resolveAuthor();
      this.updateAuthorStatus();
    }
  }

  /**
   * Diese Methode verwendet den authorService, um den Namen basierend auf der ID abzurufen. Wenn der Name geladen ist, wird er der Variable
   */
  private resolveAuthor() {
    this.authorService.getAuthorNameById(this.post.author).subscribe((user: UserInterface) => {
      this.authorName = user.name;
      this.authorAvatar = user.avatar;
    });
  }

  postTime(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  lastThreadMsgTime() {
    if (!this.post.threadMsg?.length) return '';
    const date = new Date(this.post.threadMsg[this.post.threadMsg.length - 1].timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  private updateAuthorStatus() {
    this.isAuthorCurrentUser = this.post.author === this.storage.currentUser?.id;
  }

  openThread(postId: string) {
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
  }

  getUserName(id: string) {
    const user = this.storage.user.find(user => user.id === id);
    if (user) return user.name;
    return '';
  }

  filterEmoticonNameArray(names: string[], index: number) {
    let newNames = [...names];
    let self = newNames.findIndex(name => name === this.storage.currentUser?.id);
    if (self !== -1) {
      newNames.splice(self, 1);
      this.reactSelf = true;
    }
    let newIndex = this.reactSelf ? index - 1 : index;
    if (newNames.length === 0) return 'Du';
    else if ((newNames.length - 1 === newIndex) && this.reactSelf) return this.getUserName(newNames[newIndex]) + ' und Du';
    else if (newNames[newIndex] !== this.storage.currentUser?.id) return this.getUserName(newNames[newIndex]);
    else return;
  }

  getLastEmoji() {
    let last = localStorage.getItem('emoji-mart.last') || '';
    let emojiObject = this.emoji.getData(last);
    if (emojiObject) return {
      'emoji':
      {
        'native': emojiObject.native,
        'origin': this.origin,
        'isThread': this.isThread,
        'post': this.post,
        'isInput': false
      }
    }
    else return { 'emoji': { 'native': this.emoji.getData('+1')?.native, 'origin': this.origin, 'isThread': this.isThread, 'post': this.post, 'isInput': false } };
  }


  getMostRecentEmoji() {
    let recentEmojis = localStorage.getItem('emoji-mart.frequently') || '';
    let lastUsed = localStorage.getItem('emoji-mart.last') || '';
    let most = recentEmojis ? JSON.parse(recentEmojis) : '';
    if (!most) return { emoji: { native: this.emoji.getData('clap')?.native, origin: this.origin, isThread: this.isThread, post: this.post, isInput: false } };
    const mostKeys = Object.keys(most);
    const mostUsed = mostKeys.reduce((a, b) => most[a] > most[b] ? a : b);
    const secondMostUsed = mostKeys.filter(key => key !== mostUsed).reduce((a, b) => most[a] > most[b] ? a : b);
    if (mostUsed !== lastUsed) return { emoji: { native: this.emoji.getData(mostUsed)?.native, origin: this.origin, isThread: this.isThread, post: this.post, isInput: false } };
    else if (secondMostUsed !== lastUsed) return { emoji: { native: this.emoji.getData(secondMostUsed)?.native, origin: this.origin, isThread: this.isThread, post: this.post, isInput: false } };
    else return { emoji: { native: this.emoji.getData('clap')?.native, origin: this.origin, isThread: this.isThread, post: this.post, isInput: false } };
  }
}

