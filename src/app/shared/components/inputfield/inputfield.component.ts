import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
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
  imports: [FormsModule, PickerModule, EmojiSelectorComponent, TextFormatterDirective, UploadComponent, NgIf],
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

  @ViewChild(TextFormatterDirective) formatter!: TextFormatterDirective;
  @ViewChild('tagSearchInput') tagSearchInput!: ElementRef;
  @ViewChild('tagSearchInputThread') tagSearchInputThread!: ElementRef;
  @ViewChild('messageContent') messageContent!: ElementRef;
  @ViewChild('messageContentThread') messageContentThread!: ElementRef;

  @Input() thread: boolean = false;
  @Input() post: PostInterface = { text: '', author: '', timestamp: 0, thread: false, id: '' };
  @Input() edit: boolean = false;
  @Output() editChange = new EventEmitter<boolean>();

  public message: string = '';
  startInput: boolean = false;
  showEmojiSelector: boolean = false;
  showTagSearch: boolean = false;
  showTagSearchThread: boolean = false;
  showUpload: boolean = false;
  tagSearch: string = '';
  suggestion: UserInterface | ChannelInterface | undefined = undefined;
  matchingSearch: UserInterface[] | ChannelInterface[] = [];
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
    if (!path.includes(this.elementRef.nativeElement.querySelector('.active, .tag-search'))) this.toggleTagSearch(event, false);
  }


  @HostListener('document:keydown', ['$event'])
  /**
   * Checks keyboard events and determines the appropriate action based on the 
   * context of the target element. If the event occurs inside the tag search 
   * input, it delegates handling to `handleTagSearch`. If the event occurs 
   * inside the message content, it delegates handling to `handleMessage`.
   * 
   * @param {KeyboardEvent} event - The keyboard event to process.
   */
  checkKey(event: KeyboardEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.inputEvent.isInsideTagSearch(targetElement)) this.handleTagSearch(event);
    if (this.inputEvent.isInsideMessageContent(targetElement)) this.handleMessage(event);
  }


  /**
   * Handles tag search key events.
   * If a send button-related key event occurs and there is a suggestion, 
   * it adds the formatted tag to the input field. 
   * If the 'Escape' key is pressed, it toggles the tag search off.
   * 
   * @param {KeyboardEvent} event - The keyboard event to handle.
   */
  handleTagSearch(event: KeyboardEvent) {
    if (this.inputEvent.isSendButtonAndTagSearch(event) && this.suggestion) this.formatter.addTag(event, this.suggestion);
    if (event.key === 'Escape') this.toggleTagSearch(event, false);
  }


  /**
   * Handles key presses in the message content element.
   * If the 'Enter' key is pressed and there is a message in the input field, it sends the message.
   * If the 'Backspace' key is pressed and the caret is at the beginning of the message content, it removes the last tag.
   * @param {KeyboardEvent} event The event object.
   * @returns {void}
   */
  handleMessage(event: KeyboardEvent): void {
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    if (this.inputEvent.isSendButtonAndMessage(event) && message !== '') {
      event.preventDefault();
      this.sendMessage();
    }
    if (event.key === '@' || event.key === '#') this.toggleTagSearch(event, true);
    if (event.key === 'Backspace') this.inputEvent.isBackspaceAndMessage(event);
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
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    this.message = message.innerHTML;
    this.startInput = (message.innerHTML === '' || message.innerHTML === '<br>') ? false : true;
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
    let path = event.path || (event.composedPath && event.composedPath());
    const hasThreadInPath = this.helper.hasThreadInPath(path);
    this.showTagSearch = hasThreadInPath ? false : state;
    this.showTagSearchThread = hasThreadInPath ? state : false;
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
    this.setFocus();
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
   * Handles user input in the tag search input field.
   * If the input field contains text, it initiates a tag search.
   * If the input field is empty, it resets the suggestion to a channel tag.
   */
  tagSearchKeyInput() {
    this.matchingSearch = [];
    if (this.tagSearch && this.tagSearch.length > 0) this.initiateTagSearch();
    else this.suggestion = this.helper.generateChannelTag();
  }


  /**
   * Initiates a tag search based on the tag search input.
   * Determines whether to initiate a user or channel tag search 
   * based on the prefix of the input ('@' for user and '#' for channel).
   * If neither prefix is present, it defaults the suggestion to a channel tag.
   */

  initiateTagSearch() {
    if (this.tagSearch.startsWith('@')) this.initiateUserTagSearch();
    else if (this.tagSearch.startsWith('#')) this.initiateChannelTagSearch();
    else this.suggestion = this.helper.generateChannelTag();
  }


  /**
   * Initiates a user tag search based on the user's input.
   * Filters through the channel's users and returns matches that include the user's input.
   * Sets the suggestion to the first match if there are multiple matches, otherwise resets the suggestion to a channel tag.
   */
  initiateUserTagSearch() {
    let match: UserInterface | undefined;
    let channelUsers: string[] = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user || [];
    let users: UserInterface[] = channelUsers.length > 0 ? this.storage.user.filter(user => channelUsers.includes(user.id!)) : [];
    this.matchingSearch = users.filter(user => user.name.toLowerCase().includes(this.tagSearch.slice(1).toLowerCase()));
    match = this.matchingSearch.length > 1 ? this.matchingSearch[0] : undefined;
    if (match) this.suggestion = match;
    else this.suggestion = this.helper.generateChannelTag();
  }



  /**
   * Initiates a channel tag search based on the user's input.
   * Filters through the user's channels and returns matches that include the user's input.
   * Sets the suggestion to the first match if there are multiple matches, otherwise resets the suggestion to a channel tag.
   */
  initiateChannelTagSearch() {
    let match: ChannelInterface | undefined;
    let userChannels: ChannelInterface[] = this.storage.channel.filter(channel => channel.user.includes(this.storage.currentUser.id!)) || [];
    this.matchingSearch = userChannels.filter(channel => channel.name.toLowerCase().includes(this.tagSearch.slice(1).toLowerCase()));
    match = this.matchingSearch.length > 1 ? this.matchingSearch[0] : undefined;
    if (match) this.suggestion = match;
    else this.suggestion = this.helper.generateChannelTag();
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
    if (openTagSearch) {
      this.showTagSearch = false;
      this.showTagSearchThread = false;
    }
    if (openEmoji) this.showEmojiSelector = false;
    this.tagSearch = '';
    this.matchingSearch = [];
    this.suggestion = undefined;
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
    if (this.showTagSearch || this.showTagSearchThread) return thread ? this.tagSearchInputThread?.nativeElement : this.tagSearchInput?.nativeElement;
    else return thread ? this.messageContentThread?.nativeElement : this.messageContent?.nativeElement;
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