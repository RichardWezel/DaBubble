import { Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PostInterface } from '../../interfaces/post.interface';
import { AuthorService } from '../../services/author.service';
import { UserInterface } from '../../interfaces/user.interface';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NgStyle } from '@angular/common';
import { EmojiSelectorComponent } from '../emoji-selector/emoji-selector.component';
import { EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { DomSanitizer } from '@angular/platform-browser';


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
  emojiSelector = inject(EmojiSelectorComponent);
  emoji = inject(EmojiService);
  sanitizer = inject(DomSanitizer);

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


  /**
   * Handles clicks outside of the emoji selector component.
   * Stops the event from propagating and checks if the click target is outside the emoji selector.
   * If the target is outside, hides the emoji selector by setting the showEmojiSelector flag to false.
   * 
   * @param {MouseEvent} event - The event object representing the click.
   */
  outsideClick(event: any) {
    event.stopPropagation();
    const path = event.path || (event.composedPath && event.composedPath());
    if (!path.includes(this.elementRef.nativeElement.querySelector('app-emoji-selector'))) {
      this.showEmojiSelector = false;
    }
  }


  /**
   * Lifecycle hook that is called after the component is initialized.
   * It resolves the author information from the post's author ID and updates the author status.
   */
  ngOnInit() {
    this.resolveAuthor();
    this.updateAuthorStatus();
  }


  /**
   * Lifecycle hook that is called when any data-bound property of the component is changed.
   * If the changed property is the post, it resolves the author information from the post's author ID and updates the author status.
   * @param {SimpleChanges} changes - An object whose key is the property name and the value is the SimpleChange object.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post']) {
      this.resolveAuthor();
      this.updateAuthorStatus();
    }
  }


  /**
   * Resolves the author information from the post's author ID.
   * It uses the AuthorService to get the author's name and avatar from the author ID and updates the component's
   * authorName and authorAvatar properties.
   */
  private resolveAuthor() {
    this.authorService.getAuthorNameById(this.post.author).subscribe((user: UserInterface) => {
      this.authorName = user.name;
      this.authorAvatar = user.avatar;
    });
  }


  /**
   * Converts a timestamp to a localized string representing the time of day.
   * It uses the toLocaleTimeString() method of the Date object with the 'de-DE' locale
   * and the options { hour: '2-digit', minute: '2-digit' } to format the time as 'HH:mm'.
   *
   * @param {number} timestamp - The timestamp to convert.
   * @returns {string} The localized string representing the time of day.
   */
  postTime(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }


  /**
   * Converts the timestamp of the last message in the thread to a localized string representing the time of day.
   * It uses the toLocaleTimeString() method of the Date object with the 'de-DE' locale
   * and the options { hour: '2-digit', minute: '2-digit' } to format the time as 'HH:mm'.
   *
   * @returns {string} The localized string representing the time of day of the last message in the thread.
   */
  lastThreadMsgTime() {
    if (!this.post.threadMsg?.length) return '';
    const date = new Date(this.post.threadMsg[this.post.threadMsg.length - 1].timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }


  /**
   * Updates the isAuthorCurrentUser property by comparing the post's author ID with the
   * current user's ID from the storage. This is used to determine if the author of the
   * post is the current user.
   */
  private updateAuthorStatus() {
    this.isAuthorCurrentUser = this.post.author === this.storage.currentUser?.id;
  }


  /**
   * Opens or closes the thread of the given post ID.
   * If the thread is currently open, it will be closed, and vice versa.
   * The post ID is stored in the currentUser object in the storage.
   * @param {string} postId - The ID of the post to open or close the thread of.
   */
  openThread(postId: string) {
    this.storage.currentUser.postId = postId;
    this.storage.currentUser.threadOpen = !this.storage.currentUser.threadOpen;
  }


  /**
   * Finds the name of the user with the given ID from the storage's user array.
   * If the user is found, their name is returned. Otherwise, an empty string is returned.
   * @param {string} id - The ID of the user whose name is to be found.
   * @returns {string} The name of the user if found, otherwise an empty string.
   */
  getUserName(id: string) {
    const user = this.storage.user.find(user => user.id === id);
    if (user) return user.name;
    return '';
  }


  getText(text: string) {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }


  /**
   * Filters the given array of names by removing the current user's name, if it is present.
   * The function returns the name of the user at the given index, or 'Du' if the array is empty.
   * If the current user is present in the array, and the index points to the last element,
   * the function returns a string of the form 'User Name und Du', where 'User Name' is the name of the user at the index.
   * @param {string[]} names - The array of names to filter.
   * @param {number} index - The index of the name to return.
   * @returns {string} The name at the given index, or 'Du' if the array is empty, or a string of the form 'User Name und Du'.
   */
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


  /**
   * Gets the last emoji the user selected. If the user has not selected any emoji
   * before, the default emoji '+1' is returned.
   * @returns {EmoticonsInterface} The last emoji the user selected as an EmoticonsInterface object.
   */
  getLastEmoji() {
    let last = localStorage.getItem('emoji-mart.last') || '';
    let emojiObject = this.emoji.getData(last);
    if (emojiObject) return this.emoticonObject(emojiObject.native);
    else return this.emoticonObject(this.emoji.getData('+1')?.native);
  }


  /**
   * Retrieves the most frequently used emoji by the user, or a default emoji if no data is available.
   * The function checks the emojis stored in localStorage under 'emoji-mart.frequently' and 'emoji-mart.last'.
   * It first attempts to return the most frequently used emoji that is different from the last used emoji.
   * If the most used emoji is the same as the last used emoji, it returns the second most used emoji.
   * If neither of these is different from the last used emoji, a default 'clap' emoji is returned.
   * @returns {EmoticonsInterface} The most recent or most frequently used emoji as an EmoticonsInterface object.
   */
  getMostRecentEmoji() {
    let recentEmojis = localStorage.getItem('emoji-mart.frequently') || '';
    let lastUsed = localStorage.getItem('emoji-mart.last') || '';
    let most = recentEmojis ? JSON.parse(recentEmojis) : '';
    if (!most) return this.emoticonObject(this.emoji.getData('clap')?.native);

    const allKeys = Object.keys(most);
    const mostUsed = allKeys.reduce((a, b) => most[a] > most[b] ? a : b);
    const secondMostUsed = allKeys.filter(key => key !== mostUsed).reduce((a, b) => most[a] > most[b] ? a : b);

    if (mostUsed !== lastUsed) return this.emoticonObject(this.emoji.getData(mostUsed)?.native);
    else if (secondMostUsed !== lastUsed) return this.emoticonObject(this.emoji.getData(secondMostUsed)?.native);
    else return this.emoticonObject(this.emoji.getData('clap')?.native);
  }


  emoticonObject(emoticon: string | undefined) {
    return {
      'emoji':
      {
        'native': emoticon,
        'origin': this.origin,
        'isThread': this.isThread,
        'post': this.post,
        'isInput': false
      }
    }
  }
}

