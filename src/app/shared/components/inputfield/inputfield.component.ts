import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, ViewChild, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { PostInterface } from '../../interfaces/post.interface';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { EmojiSelectorComponent } from "../emoji-selector/emoji-selector.component";
import { TextFormatterDirective } from '../../directive/text-formatter.directive';
import { UserInterface } from '../../interfaces/user.interface';
import { NavigationService } from '../../services/navigation.service';
import { Subscription } from 'rxjs';
import { CloudStorageService } from '../../services/cloud-storage.service';
import { SendMessageService } from './services/send-message.service';
import { InputEventsService } from './services/input-events.service';
import { UploadComponent } from "./components/upload/upload.component";
import { NgIf } from '@angular/common';
import { InputfieldHelperService } from './services/inputfield-helper.service';
import { ChannelInterface } from '../../interfaces/channel.interface';


@Component({
  selector: 'app-inputfield',
  standalone: true,
  imports: [FormsModule, PickerModule, EmojiSelectorComponent, forwardRef(() => TextFormatterDirective), UploadComponent, NgIf],
  templateUrl: './inputfield.component.html',
  styleUrl: './inputfield.component.scss'
})
export class InputfieldComponent implements OnChanges, AfterViewInit, OnDestroy {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  navigationService = inject(NavigationService);
  cloud = inject(CloudStorageService);
  sendMessageService = inject(SendMessageService);
  inputEvent = inject(InputEventsService);
  helper = inject(InputfieldHelperService);

  @ViewChild(forwardRef(() => TextFormatterDirective)) formatter!: TextFormatterDirective;
  @ViewChild('messageContent') messageContent!: ElementRef;
  @ViewChild('messageContentThread') messageContentThread!: ElementRef;

  @Input() thread: boolean = false;
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, id: '' };
  @Input() edit: boolean = false;
  @Output() editChange = new EventEmitter<boolean>();

  public message: string = '';
  startInput: boolean = false;
  showEmojiSelector: boolean = false;
  showTagSearch: boolean = false;
  showUpload: boolean = false;
  /** Suggestions for the @name / #channel being typed in the message itself. */
  matchingSearch: (UserInterface | ChannelInterface)[] = [];
  activeSuggestion: number = 0;
  /** Where the typed trigger sits, so a pick replaces exactly that text. */
  private mention?: { node: Text, start: number, end: number, trigger: '@' | '#' };
  private subscription!: Subscription;


  constructor() { }


  /**
   * Sets the focus on the input field after the component has finished rendering.
   * This is needed because the input field is not yet rendered when the component
   * is initialized, so setting the focus immediately does not work.
   */
  ngAfterViewInit() {
    this.subscription = this.navigationService.channelChanged.subscribe((channelId) => {
      this.reset();
    });
    setTimeout(() => this.setFocus(), 350);
  }


  /**
   * Lifecycle hook that is called when any data-bound property of the component changes.
   * Sets the focus on the input field after the component has finished rendering.
   * This is needed because the input field is not yet rendered when the component
   * is initialized, so setting the focus immediately does not work.
   */
  ngOnChanges(): void {
    setTimeout(() => this.setFocus(), 350);
  }


  /**
   * Cleans up the subscription to the channel changes event when the component is destroyed.
   * This is necessary to prevent memory leaks.
   */
  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }


  @HostListener('document:click', ['$event'])
  /**
   * Handles clicks outside of the emoji selector and tag search components.
   * Stops the event from propagating and checks if the click target is outside the
   * emoji selector or tag search.
   * If the target is outside, hides the emoji selector or tag search by setting
   * the showEmojiSelector or showTagSearch flag to false.
   * @param {MouseEvent} event - The event object representing the click.
   */
  outsideClick(event: any): void {
    event.stopPropagation();
    const path = event.path || (event.composedPath && event.composedPath());
    if (!path.includes(this.elementRef.nativeElement.querySelector('.active, .smileys-container'))) this.showEmojiSelector = false;
    if (!path.includes(this.elementRef.nativeElement.querySelector('.mention-list'))
      && !path.includes(this.getMessageElement())) this.closeMention();
  }


  /**
   * Passes key presses in the message content on to `handleMessage`.
   *
   * Bound on the field in the template only. It used to be a document
   * listener as well, so every key ran twice - harmless for sending, but
   * Enter on a suggestion would have tagged and then sent the message.
   *
   * @param {KeyboardEvent} event - The keyboard event to process.
   */
  checkKey(event: KeyboardEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.inputEvent.isInsideMessageContent(targetElement)) this.handleMessage(event);
  }


  /**
   * Steers the suggestion list from the keyboard while it is open: arrows
   * move, Enter or Tab pick, Escape closes.
   * @param {KeyboardEvent} event - The keyboard event to handle.
   * @returns {boolean} True if the key was used by the list.
   */
  handleMentionKey(event: KeyboardEvent): boolean {
    if (!this.showTagSearch || this.matchingSearch.length === 0) return false;
    const count = this.matchingSearch.length;
    if (event.key === 'ArrowDown') this.activeSuggestion = (this.activeSuggestion + 1) % count;
    else if (event.key === 'ArrowUp') this.activeSuggestion = (this.activeSuggestion - 1 + count) % count;
    else if (this.inputEvent.isSendButtonAndTagSearch(event)) this.pickSuggestion(event, this.matchingSearch[this.activeSuggestion]);
    else if (event.key === 'Escape') this.closeMention();
    else return false;
    event.preventDefault();
    return true;
  }


  /**
   * Handles key presses in the message content element.
   * If the 'Enter' key is pressed and there is a message in the input field, it sends the message.
   * If the 'Backspace' key is pressed and the caret is at the beginning of the message content, it removes the last tag.
   * @param {KeyboardEvent} event The event object.
   * @returns {void}
   */
  handleMessage(event: KeyboardEvent): void {
    if (this.handleMentionKey(event)) return;
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    if (this.inputEvent.isSendButtonAndMessage(event) && message !== '') {
      event.preventDefault();
      this.sendMessage();
    }
    if (event.key === 'Backspace') this.inputEvent.isBackspaceAndMessage(event);
  }


  /** The editable message element of this input field. */
  getMessageElement(): HTMLElement {
    return this.elementRef.nativeElement.querySelector('.message-content');
  }


  /**
   * Looks at the text right before the caret after every change. If it is an
   * @ or # that starts a word, possibly followed by what has been typed since,
   * the matching users or channels are shown above the field. This runs on
   * `input` rather than on the @ key, because mobile keyboards often do not
   * report which key was pressed.
   */
  detectMention(): void {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    const node = range?.startContainer;
    if (!range || !range.collapsed || !node || node.nodeType !== Node.TEXT_NODE || !this.getMessageElement().contains(node)) {
      this.closeMention();
      return;
    }
    const before = (node.textContent || '').slice(0, range.startOffset);
    const match = before.match(/(?:^|[\s\u200B])([@#])([^@#\n\u200B]{0,30})$/);
    if (!match) {
      this.closeMention();
      return;
    }
    const [, trigger, query] = match;
    this.mention = { node: node as Text, start: range.startOffset - query.length - 1, end: range.startOffset, trigger: trigger as '@' | '#' };
    this.matchingSearch = this.findSuggestions(trigger, query.trim().toLowerCase());
    // Names have spaces, so the query may too - but once nothing matches any
    // more, the @ was just part of the text.
    if (this.matchingSearch.length === 0 && /\s/.test(query)) {
      this.closeMention();
      return;
    }
    this.activeSuggestion = 0;
    this.showTagSearch = true;
  }


  /**
   * Users (for @) or channels (for #) whose name contains the query, plus the
   * @Everyone / #Channel shortcuts. Users come from the current channel, or
   * from everyone in a direct message, which has no member list.
   * @param trigger - '@' or '#'
   * @param query - what was typed after it, lower case
   */
  findSuggestions(trigger: string, query: string): (UserInterface | ChannelInterface)[] {
    const matches = (name: string) => name.toLowerCase().includes(query);
    if (trigger === '@') {
      const members = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user;
      const users = members ? this.storage.user.filter(user => members.includes(user.id!)) : this.storage.user;
      const everyone: UserInterface = { type: 'user', name: 'Everyone', id: 'channel', email: '', online: false, avatar: '' };
      return [...users.filter(user => matches(user.name)), ...(matches(everyone.name) ? [everyone] : [])];
    }
    const channels = this.storage.channel.filter(channel => channel.user.includes(this.storage.currentUser.id!));
    const current: ChannelInterface = { type: 'channel', name: 'Channel', description: '', user: [], owner: '', id: 'channel' };
    return [...channels.filter(channel => matches(channel.name)), ...(matches(current.name) ? [current] : [])];
  }


  /**
   * Replaces the typed @query with the tag, right where it was typed, and
   * puts the caret behind it.
   * @param event - the click or key that picked the suggestion
   * @param suggestion - the user or channel to tag
   */
  pickSuggestion(event: Event, suggestion: UserInterface | ChannelInterface): void {
    event.preventDefault();
    event.stopPropagation();
    const mention = this.mention;
    if (!mention || !mention.node.isConnected) {
      this.closeMention();
      return;
    }
    const tag = document.createElement('span');
    tag.contentEditable = 'false';
    tag.className = 'tagMessage';
    tag.textContent = (suggestion.type === 'user' ? '@' : '#') + suggestion.name;
    // The zero-width space behind the tag gives the caret a place to sit and
    // is what the Backspace handling looks for to delete a tag in one go.
    const spacer = document.createTextNode('\u200B');
    const range = document.createRange();
    range.setStart(mention.node, mention.start);
    range.setEnd(mention.node, mention.end);
    range.deleteContents();
    range.insertNode(spacer);
    range.insertNode(tag);
    const caret = document.createRange();
    caret.setStart(spacer, 1);
    caret.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(caret);
    this.startInput = true;
    this.message = this.getMessageElement().innerHTML;
    this.closeMention();
  }


  /** Hides the suggestion list. */
  closeMention(): void {
    this.showTagSearch = false;
    this.matchingSearch = [];
    this.activeSuggestion = 0;
    this.mention = undefined;
  }


  /**
   * The @ button: types an @ at the caret in the message field, which opens
   * the suggestions the same way typing it does.
   */
  insertMentionTrigger(): void {
    const message = this.getMessageElement();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !message.contains(selection.anchorNode)) {
      message.focus();
      this.helper.setFocusContentEditable(message);
    }
    const range = window.getSelection()!.getRangeAt(0);
    const before = range.startContainer.nodeType === Node.TEXT_NODE
      ? (range.startContainer.textContent || '').slice(0, range.startOffset) : '';
    const text = document.createTextNode(before && !/[\s\u200B]$/.test(before) ? ' @' : '@');
    range.deleteContents();
    range.insertNode(text);
    range.setStart(text, text.length);
    range.collapse(true);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);
    this.startInput = true;
    this.detectMention();
  }


  @HostListener('document:keyup', ['$event'])
  /**
   * Handles keyup events in the message content element.
   * It updates the message property with the current HTML content of the element and
   * sets the startInput flag accordingly. It also sets the focus to the correct element.
   * @param {KeyboardEvent} event - The event object.
   * @returns {void}
   */
  checkInput(event: KeyboardEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) return;
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    this.message = message.innerHTML;
    this.startInput = (message.innerHTML === '' || message.innerHTML === '<br>') ? false : true;
    // setFocus puts the caret at the end, which would lose the spot the
    // suggestions are for.
    if (this.showTagSearch) return;
    this.setFocus(event);
  }


  /**
   * Handles sending a message.
   * If the message is empty or the user is not logged in or no channel is selected, do nothing.
   * Otherwise, generate a new post and handle it differently depending on whether it's a thread or not.
   * @returns {void}
   */
  sendMessage(): void {
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    if (!message.innerHTML || !this.storage.currentUser.id || !this.storage.currentUser.currentChannel) return;
    let newMessage = this.elementRef.nativeElement.querySelector('.message-content');
    let newPost: PostInterface = this.helper.generateNewPost(newMessage.innerHTML);
    if (this.thread) this.sendMessageService.handleThreadPost(newPost);
    else this.sendMessageService.handleNormalPost(newPost);
    message.innerHTML = '';
    this.startInput = false;
    this.helper.scrollToPost(newPost.id);
  }


  /**
   * Saves the current message in the input field as a post.
   * 
   * If the message is empty or the user is not logged in or no channel is selected, do nothing.
   * Otherwise, overwrite the given post with the current message content and edit it.
   * @param post - The post to edit.
   */
  async savePost(post: PostInterface): Promise<void> {
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    if (!message.innerHTML || !this.storage.currentUser.id || !this.storage.currentUser.currentChannel) return;
    post.text = message.innerHTML;
    this.sendMessageService.editMessage(post, this.thread);
    message.innerHTML = '';
    this.edit = !this.edit;
    this.editChange.emit(this.edit);
  }


  /**
   * Appends the given emoji to the current message.
   * 
   * @param emoji - The emoji string to add to the message.
   */
  addEmoji(emoji: string) {
    let newMessage = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    newMessage.innerHTML += emoji;
    newMessage.innerHTML = newMessage.innerHTML.replaceAll('<br>', '');
    this.startInput = true;
    this.setFocus();
    this.showEmojiSelector = false;
  }


  /**
   * Toggles the visibility of the tag search or tag search thread based on the event path.
   * Determines whether the event path includes a thread and toggles the appropriate search
   * visibility flags accordingly.
   * 
   * @param {any} event - The event object to determine the path.
   * @param {boolean} state - The desired visibility state for the tag search when no thread is in the path.
   */
  toggleTagSearch(event: any, state: boolean) {
    if (!state) this.closeMention();
    this.resetAll(true, false, true);
    this.setFocus(event);
  }


  /**
   * Toggles the visibility of the emoji selector.
   * Resets the tag search, matching users, and suggestion when toggled.
   * Disables the tag search input and file upload options.
   * Sets focus to the appropriate element based on the new state.
   */
  toggleEmojiSelector() {
    this.showEmojiSelector = !this.showEmojiSelector;
    this.resetAll(true, true, false);
    // On a touchscreen the keyboard would take half the screen and push the
    // top of the picker out of view, so opening the picker closes it instead.
    // Picking an emoji focuses the field again (addEmoji).
    if (this.showEmojiSelector && matchMedia('(hover: none)').matches) {
      (document.activeElement as HTMLElement | null)?.blur();
    } else {
      this.setFocus();
    }
  }


  /**
   * Toggles the visibility of the file upload section.
   * Resets the emoji selector when toggled.
   * Sets focus to the appropriate element based on the new state.
   */
  toggleAppendix() {
    this.showUpload = !this.showUpload;
    this.resetAll(false, true, true);
    this.setFocus();
  }


  /**
   * Resets the input field and its properties to their initial states.
   * Called when a message is sent or the user navigates away from the channel.
   */
  reset() {
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    message.innerHTML = '';
    this.resetAll();
    this.setFocus();
  }


  /**
   * Resets all properties related to the tag search and the emoji selector.
   * Sets the tag search input to an empty string, clears the matching search results,
   * resets the suggestion to undefined, and hides the emoji selector and the upload button.
   */
  resetAll(openAppendix: boolean = true, openTagSearch: boolean = true, openEmoji: boolean = true) {
    if (openAppendix) this.showUpload = false;
    if (openTagSearch) this.closeMention();
    if (openEmoji) this.showEmojiSelector = false;
  }


  /**
   * Cancels the current post edit operation. Toggles the edit mode and
   * emits the editChange event with the new state.
   */
  cancelPost() {
    this.edit = !this.edit;
    this.editChange.emit(this.edit);
  }


  /**
   * Returns the element that should receive focus based on the current state of the input field.
   * If the tag search is visible, returns the tag search input element.
   * If the emoji selector is visible, returns the emoji selector input element.
   * If the user is currently in a thread, returns the thread's input field element.
   * Otherwise, returns the main input field element.
   * @param event The event that triggered the focus request.
   * @returns The element that should receive focus.
   */
  getFocusElement(event?: any): HTMLElement {
    let path;
    if (event) path = event.path || (event.composedPath && event.composedPath());
    let thread = event ? this.helper.hasThreadInPath(path) : this.storage.currentUser.threadOpen || false;
    return thread ? this.messageContentThread?.nativeElement : this.messageContent?.nativeElement;
  }


  /**
 * Sets the focus on either the tag search input or the message content based on the showTagSearch parameter.
 * If the active element's ID is part of the excludedTags array, the focus is not set.
 * @param showTagSearch If true, sets focus on the tag search input. Otherwise, sets focus on the message content.
 */
  setFocus(event?: any) {
    let focusElement = event ? this.getFocusElement(event) : this.getFocusElement();
    if (!focusElement) focusElement = document.activeElement as HTMLElement;
    if (this.helper.isExcludedId()) focusElement = document.activeElement as HTMLElement;
    focusElement.focus();
    if (focusElement.isContentEditable) this.helper.setFocusContentEditable(focusElement);
    else if ('selectionStart' in focusElement) this.helper.setFocusInput(focusElement);
  }
}