import { Component, Input } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };

  constructor() { }

}
