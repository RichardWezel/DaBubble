import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service.ts.service';
import { User } from '@angular/fire/auth';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit, OnChanges {
  storage = inject(FirebaseStorageService);
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() threadHead: boolean = false;
  authorName: string = '';
  authorAvatar: string = '';

  isAuthorCurrentUser: boolean = false;

  constructor(private authorService: AuthorService) { }

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

}
