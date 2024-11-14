import { Component, inject, Input, OnInit } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service.ts.service';
import { User } from '@angular/fire/auth';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent implements OnInit {
  storage = inject(FirebaseStorageService);
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  authorName: string = '';
  authorAvatar: string = '';

  constructor(private authorService: AuthorService) { }

  /**
   * Der OnInit-Hook ist nützlich, um eine Methode direkt nach der Initialisierung der Komponente auszuführen.
   */
  ngOnInit() {
    this.resolveAuthorName();
  }

  /**
   * Diese Methode verwendet den authorService, um den Namen basierend auf der ID abzurufen. Wenn der Name geladen ist, wird er der Variable
   */
  private resolveAuthorName() {
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

}
