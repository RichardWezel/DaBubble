import { Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service';
import { User } from '@angular/fire/auth';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { EmojiSelectorComponent } from '../emoji-selector/emoji-selector.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgStyle, EmojiSelectorComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit, OnChanges {
  storage = inject(FirebaseStorageService);
  elementRef: ElementRef = inject(ElementRef);
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() threadHead: boolean = false;
  @Input() origin: string = '';
  @Input() isThread: boolean = false;
  authorName: string = '';
  authorAvatar: string = '';
  showEmojiSelector: boolean = false;

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
    this.storage.currentUser.threadOpen = true;
  }

}
