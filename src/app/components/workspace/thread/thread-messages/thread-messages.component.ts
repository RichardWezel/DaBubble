import { Component } from '@angular/core';
import { ChannelMessagesComponent } from '../../channel/channel-messages/channel-messages.component';
import { DateSeparatorComponent } from '../../../../shared/components/date-separator/date-separator.component';
import { MessageComponent } from '../../../../shared/components/message/message.component';
import { PostInterface } from '../../../../shared/interfaces/post.interface';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [DateSeparatorComponent, MessageComponent],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent extends ChannelMessagesComponent {


  constructor() {
    super();
  }


  /**
   * The post the open thread hangs off. Same lookup for channels and direct
   * messages, since both keep their messages in the same stream.
   * @returns {PostInterface} the parent post, or an empty placeholder
   */
  getOriginalPost(): PostInterface {
    return this.storage.getThreadParentPost() ?? { text: '', author: '', timestamp: 0, id: '' };
  }


  /**
   * Replies of the open thread, kept up to date by the storage service.
   * @returns {PostInterface[]} the thread's replies
   */
  getThreadPosts(): PostInterface[] {
    return this.storage.threadPosts;
  }
}
