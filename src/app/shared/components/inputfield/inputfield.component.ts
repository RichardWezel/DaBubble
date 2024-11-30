import { AfterViewInit, Component, ElementRef, HostListener, inject, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { PostInterface } from '../../interfaces/post.interface';
import { UidService } from '../../services/uid.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { EmojiSelectorComponent } from "../emoji-selector/emoji-selector.component";
import { TextFormatterDirective } from '../../directive/text-formatter.directive';
import { UserInterface } from '../../interfaces/user.interface';

@Component({
  selector: 'app-inputfield',
  standalone: true,
  imports: [FormsModule, PickerModule, EmojiSelectorComponent, TextFormatterDirective],
  templateUrl: './inputfield.component.html',
  styleUrl: './inputfield.component.scss'
})
export class InputfieldComponent implements AfterViewInit {
  elementRef: ElementRef = inject(ElementRef);
  storage = inject(FirebaseStorageService);
  uid = inject(UidService);

  @ViewChild(TextFormatterDirective) formatter!: TextFormatterDirective

  @Input() thread: boolean = false;

  public message: string = '';
  startInput: boolean = false;
  showEmojiSelector: boolean = false;
  showTagSearch: boolean = false;
  tagSearch: string = '';
  suggestion: UserInterface | undefined = undefined;
  matchingUsers: UserInterface[] = [];


  constructor() { }

  @HostListener('document:click', ['$event'])


  /**
   * Sets the focus on the input field after the component has finished rendering.
   * This is needed because the input field is not yet rendered when the component
   * is initialized, so setting the focus immediately does not work.
   */
  ngAfterViewInit() {
    setTimeout(() => this.setFocus(), 250);
  }

  /**
   * Lifecycle hook that is called when any data-bound property of the component changes.
   * Sets the focus on the input field after the component has finished rendering.
   * This is needed because the input field is not yet rendered when the component
   * is initialized, so setting the focus immediately does not work.
   */

  ngOnChanges(): void {
    setTimeout(() => this.setFocus(), 250);
  }


  /**
   * Sets the focus on the input field if it exists.
   * This method is called in lifecycle hooks to ensure that the focus is set
   * after the component has finished rendering.
   */
  setFocus() {
    const focusElement = this.getFocusElement();
    if (focusElement) focusElement.focus();
  }


  /**
   * Retrieves the HTML element that should receive focus based on the current state.
   * If the tag search is active, it returns the input element for tag search, 
   * otherwise returns the message content element. The specific element is chosen 
   * based on whether the thread is open or not.
   * 
   * @returns {HTMLElement | null} The HTML element to be focused, or null if not found.
   */
  getFocusElement(): HTMLElement | null {
    const isThreadOpen = this.storage.currentUser.threadOpen;
    if (this.showTagSearch) return this.elementRef.nativeElement.querySelector(
      isThreadOpen ? '#tag-search-input-thread' : '#tag-search-input'
    );
    return this.elementRef.nativeElement.querySelector(
      isThreadOpen ? '#messageContentThread' : '#messageContent'
    );
  }


  /**
   * Handles outside clicks on the emoji selector.
   * If the target element is not the emoji selector or one of its children, hide the emoji selector.
   * @param {MouseEvent} event The event object.
   * @returns {void}
   */
  outsideClick(event: any): void {
    event.stopPropagation();
    const path = event.path || (event.composedPath && event.composedPath());
    if (!path.includes(this.elementRef.nativeElement.querySelector('.smileys, .smileys-container'))) {
      this.showEmojiSelector = false;
    }
  }


  /**
   * Handles keydown events for the input field.
   * Determines the context of the key press by checking whether the event target
   * is within the tag search input or the message content area, and delegates
   * handling to respective functions.
   * 
   * @param {KeyboardEvent} event - The keyboard event triggered by user input.
   */
  checkKey(event: KeyboardEvent) {
    const targetElement = event.target as HTMLElement;
    if (this.isInsideTagSearch(targetElement)) this.handleTagSearch(event);
    if (this.isInsideMessageContent(targetElement)) this.handleMessage(event);
  }


  /**
   * Handles key presses in the message content element.
   * If the 'Enter' key is pressed and there is a message in the input field, it sends the message.
   * If the 'Backspace' key is pressed and the caret is at the beginning of the message content, it removes the last tag.
   * @param {KeyboardEvent} event The event object.
   * @returns {void}
   */
  handleMessage(event: KeyboardEvent): void {
    if (this.isSendButtonAndMessage(event) && this.message !== '') this.sendMessage();
    if (event.key === 'Backspace') this.isBackspaceAndMessage(event);
  }


  /**
   * Determines if the target element is either the message content or the thread message content.
   * @param {HTMLElement} targetElement - The element to check.
   * @returns {boolean} True if the target element is either the message content or the thread message content, otherwise false.
   */
  isInsideMessageContent(targetElement: HTMLElement): boolean {
    return targetElement.id === 'messageContent' || targetElement.id === 'messageContentThread'
  }


  /**
   * Determines if the event corresponds to pressing the Enter or NumpadEnter key.
   *
   * @param {KeyboardEvent} event - The keyboard event to check.
   * @returns {boolean} True if the event key is 'Enter' or 'NumpadEnter', otherwise false.
   */
  isSendButtonAndMessage(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === 'NumpadEnter'
  }


  /**
   * Handles the Backspace key being pressed while the caret is inside the message content.
   * If the caret is after a zero-width space character and the previous element is a tag message,
   * it removes the tag by calling the removeTag() function and prevents the default event action.
   * @param {KeyboardEvent} event The event object.
   * @returns {void}
   */
  isBackspaceAndMessage(event: KeyboardEvent): void {
    const selection = window.getSelection() as Selection;
    if (!this.isValidSelection(selection)) return;

    const { currentNode, offset } = this.getSelectionDetails(selection);
    if (!this.isValidTextNode(currentNode)) return;

    const previousElement = currentNode.previousSibling as HTMLElement;
    if (this.isTagMessage(previousElement) && this.isCursorAfterZeroWidthSpace(currentNode, offset)) {
      this.removeTag(previousElement, currentNode, offset);
      event.preventDefault();
    }
  }


  /**
   * Determines if the given selection is valid, i.e. it contains one or more ranges.
   * @param {Selection | null} selection - The selection to check.
   * @returns {boolean} True if the selection is valid, otherwise false.
   */
  isValidSelection(selection: Selection | null): boolean {
    return !!selection && selection.rangeCount > 0;
  }



  /**
   * Returns an object containing the node and offset of the caret in the message content element.
   * The node is the element that contains the caret, and the offset is the number of characters
   * from the start of the node where the caret is.
   * @param {Selection} selection - The selection object containing the range of the caret position.
   * @returns {{ currentNode: Node, offset: number }} - An object containing the node and offset of the caret.
   */
  getSelectionDetails(selection: Selection): { currentNode: Node, offset: number } {
    const range = selection.getRangeAt(0);
    return { currentNode: range.startContainer, offset: range.startOffset };
  }


  /**
   * Checks whether the given node is a valid text node.
   * A valid text node is defined as a node with a nodeType of TEXT_NODE
   * and having a previous sibling.
   *
   * @param {Node} node - The node to be checked.
   * @returns {boolean} True if the node is a valid text node, otherwise false.
   */
  isValidTextNode(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE && !!node.previousSibling;
  }


  /**
   * Determines if the given HTML element is a tag message.
   * A tag message is defined as a <span> element with the class 'tagMessage'.
   *
   * @param {HTMLElement} element - The HTML element to check.
   * @returns {boolean} True if the element is a tag message, otherwise false.
   */
  isTagMessage(element: HTMLElement): boolean {
    return element?.tagName === 'SPAN' && element.classList.contains('tagMessage');
  }


  /**
   * Checks if the cursor is positioned immediately after a zero-width space character
   * in the given text node.
   *
   * @param {Node} node - The text node to check within.
   * @param {number} offset - The offset position of the cursor within the text node.
   * @returns {boolean} True if the cursor is after a zero-width space character, otherwise false.
   */
  isCursorAfterZeroWidthSpace(node: Node, offset: number): boolean {
    const textBeforeCursor = (node.textContent || '').slice(0, offset);
    return textBeforeCursor.endsWith('\u200B');
  }


  /**
   * Removes a tag message from the message content.
   * The tag element is removed from the DOM and the text content of the message content is updated.
   * The offset position of the cursor is updated by subtracting the length of the tag message.
   * @param {HTMLElement} tagElement The <span> element representing the tag message to be removed.
   * @param {Node} textNode The text node containing the tag message.
   * @param {number} offset The offset position of the cursor within the text node.
   */
  removeTag(tagElement: HTMLElement, textNode: Node, offset: number): void {
    tagElement.remove();
    const textContent = textNode.textContent || '';
    textNode.textContent = textContent.slice(0, offset - 1) + textContent.slice(offset);
  }


  /**
   * Checks if the given target element is inside the tag search input.
   * @param {HTMLElement} targetElement The element to check.
   * @returns {boolean} True if the element is inside the tag search input, false otherwise.
   */
  isInsideTagSearch(targetElement: HTMLElement): boolean {
    return targetElement.id === 'tag-search-input' || targetElement.id === 'tag-search-input-thread'
  }


  /**
   * Handles key events in the tag search input.
   * If the user presses the send button and a suggestion is available, adds the suggestion as a tag.
   * If the user presses the escape key, toggles the tag search input.
   * @param {KeyboardEvent} event The event object.
   */
  handleTagSearch(event: KeyboardEvent) {
    if (this.isSendButtonAndTagSearch(event) && this.suggestion) this.formatter.addTag(this.suggestion);
    if (event.key === 'Escape') this.toggleTagSearch();
  }


  /**
   * Checks if the given key event is a send button event.
   * @param {KeyboardEvent} event The event object.
   * @returns {boolean} True if the event is a send button event, false otherwise.
   */
  isSendButtonAndTagSearch(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === 'NumpadEnter' || event.key === 'Tab';
  }


  checkInput(event: KeyboardEvent) {
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    this.startInput = (message.innerHTML === '' || message.innerHTML === '<br>') ? false : true;
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
    let newPost: PostInterface = this.generateNewPost();
    if (this.thread) this.handleThreadPost(newPost);
    else this.handleNormalPost(newPost);
    message.innerHTML = '';
    this.startInput = false;
  }


  /**
   * Checks if the current channel is a channel in the storage.
   * Searches the list of channels to find one matching the current channel ID.
   * 
   * @returns {object | undefined} The channel object if found, otherwise undefined.
   */
  isChannel(): object | undefined {
    return this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel);
  }


  /**
   * Checks if the current channel is a direct message (DM).
   * Searches the current user's DM list to find a DM matching the current channel ID.
   * 
   * @returns {object | undefined} The DM object if found, otherwise undefined.
   */
  isDM(): object | undefined {
    return this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
  }


  /**
   * Checks if the current direct message is a self-direct message.
   * A self-direct message is a direct message where the contact is the same as the current user.
   * @returns {boolean}
   */
  isSelfDm(): boolean {
    return this.storage.currentUser.id === this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact;
  }



  /**
   * Generates a new post from the current message content.
   * 
   * @returns {PostInterface} A new post object with the current message content.
   */
  generateNewPost(): PostInterface {
    let newMessage = this.elementRef.nativeElement.querySelector('.message-content');
    return {
      text: newMessage.innerHTML,
      timestamp: new Date().getTime(),
      author: this.storage.currentUser.id || '',
      id: this.uid.generateUid(),
      thread: false,
      emoticons: [],
      threadMsg: [],
    }
  }


  /**
   * If the user is in a channel, calls writeThreadToChannel with the new post.
   * If the user is in a DM, calls writeThreadToDm with the new post.
   * @param newPost - The new post to append to the currently replied-to post.
   */
  handleThreadPost(newPost: PostInterface) {
    if (this.isChannel()) this.writeThreadToChannel(newPost);
    else if (this.isDM()) this.writeThreadToDm(newPost);
  }


  /**
   * If the user is in a channel, finds the post that the user is currently replying to by ID,
   * and updates it with the new post text.
   * @param newPost - The new post to append to the currently replied-to post.
   */
  writeThreadToChannel(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    let posts = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.posts;
    let post = posts?.find(post => post.id === this.storage.currentUser.postId);
    if (post && this.storage.currentUser.postId) {
      let updatedPost = this.updatePost(post, newPost);
      this.storage.updateChannelPost(this.storage.currentUser.currentChannel, this.storage.currentUser.postId, updatedPost);
    }
  }


  /**
   * Writes a new thread message to a direct message (DM).
   * This function updates the existing post with a new message in the thread.
   * If the DM is not a self-DM, it updates the DM for both users involved.
   * 
   * @param newPost - The new post to add to the thread.
   */
  writeThreadToDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    let dm = this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel);
    let post = dm?.posts.find(post => post.id === this.storage.currentUser.postId);
    if (post && this.storage.currentUser.postId) {
      let updatedPost = this.updatePost(post, newPost);
      this.storage.updateDmPost(this.storage.currentUser.id, dm?.contact || '', this.storage.currentUser.postId, updatedPost);
      if (!this.isSelfDm())
        this.storage.updateDmPost(dm?.contact || '', this.storage.currentUser.id, this.storage.currentUser.postId, updatedPost);
    }
  }


  /**
   * Updates an existing post with a new post and sets the post as a thread.
   * The new post is added to the threadMsg array of the existing post.
   * @param post - The existing post to update.
   * @param newPost - The new post to add to the thread.
   * @returns The updated post with the new post added to its thread.
   */
  updatePost(post: PostInterface, newPost: PostInterface) {
    post.thread = true;
    post.threadMsg?.push(newPost);
    return post;
  }


  /**
   * Writes a new post to a channel or a DM and updates the Firestore "channel" or "user" collection.
   * If the post is a DM and the recipient is not the user itself, it writes the post to the recipient's DM as well.
   * @param newPost - The new post to add.
   */
  handleNormalPost(newPost: PostInterface) {
    if (this.isChannel()) this.writeNormalPostToChannel(newPost);
    else if (this.isDM()) {
      this.writeNormalPostToDm(newPost);
      if (!this.isSelfDm()) this.writeNormalPostToContactDm(newPost);
    }
  }


  /**
   * Writes a normal post to the current channel.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the channel associated with the current user's active channel.
   *
   * @param newPost - The new post to write to the channel.
   */
  writeNormalPostToChannel(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writePosts(this.storage.currentUser.currentChannel, newPost);
  }


  /**
   * Writes a normal post to the direct message (DM) of the current user.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the DM with the contact associated with the current DM.
   *
   * @param newPost - The new post to write to the DM.
   */
  writeNormalPostToDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writeDm(this.storage.currentUser.id, this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', newPost);
  }


  /**
   * Writes a normal post to the direct message (DM) of the contact associated with the current DM.
   * 
   * If the current user or channel information is not available, the function returns immediately.
   * Otherwise, it writes the new post to the contact's DM with the current user's ID as the contact.
   *
   * @param newPost - The new post to write to the contact's DM.
   */
  writeNormalPostToContactDm(newPost: PostInterface) {
    if (!this.storage.currentUser.currentChannel || !this.storage.currentUser.id) return;
    this.storage.writeDm(this.storage.currentUser.dm.find(dm => dm.id === this.storage.currentUser.currentChannel)?.contact || '', this.storage.currentUser.id, newPost);
  }


  /**
   * Appends the given emoji to the current message.
   * 
   * @param emoji - The emoji string to add to the message.
   */
  addEmoji(emoji: string) {
    let newMessage = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    newMessage.innerHTML += emoji;
    let messageContent = newMessage.innerHTML;
    let lastIndex = messageContent.lastIndexOf('<br>');
    if (lastIndex !== -1) messageContent = messageContent.slice(0, lastIndex);
    newMessage.innerHTML = messageContent;
    this.startInput = true;
    this.showEmojiSelector = false;
    this.setFocus();
  }


  toggleTagSearch() {
    this.tagSearch = '';
    this.matchingUsers = [];
    this.suggestion = undefined;
    this.showTagSearch = !this.showTagSearch;
    this.setFocus();
  }


  tagSearchInput() {
    this.matchingUsers = [];
    if (this.tagSearch && this.tagSearch.length > 0) this.initiateTagSearch();
    else this.suggestion = this.generateChannelTag();
  }


  initiateTagSearch() {
    let match: UserInterface | undefined;
    let channelUsers: string[] = this.storage.channel.find(channel => channel.id === this.storage.currentUser.currentChannel)?.user || [];
    let users: UserInterface[] = channelUsers.length > 0 ? this.storage.user.filter(user => channelUsers.includes(user.id!)) : [];
    this.matchingUsers = users.filter(user => user.name.toLowerCase().includes(this.tagSearch.toLowerCase()));
    match = this.matchingUsers.length > 0 ? this.matchingUsers[0] : undefined;
    if (match) this.suggestion = match;
    else this.suggestion = this.generateChannelTag();
  }

  generateChannelTag() {
    return { name: 'Channel', id: 'channel', email: '', online: false, avatar: '', dm: [] };
  }
}



