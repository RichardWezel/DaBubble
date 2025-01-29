import { ElementRef, inject, Injectable } from '@angular/core';
import { UserInterface } from '../../../interfaces/user.interface';
import { FirebaseStorageService } from '../../../services/firebase-storage.service';
import { PostInterface } from '../../../interfaces/post.interface';
import { UidService } from '../../../services/uid.service';

@Injectable({
  providedIn: 'root'
})
export class InputfieldHelperService {
  storage = inject(FirebaseStorageService);
  private elementRef!: ElementRef;
  uid = inject(UidService);

  excludedTags: string[] = ['messageContent', 'newMessageInput', 'searchbar', 'channel-name', 'channel-description', 'profile-name', 'profile-email', 'editMessage', 'newChannelMemberInput', 'result-dropdown'];


  constructor() { }


  setElementRef(elementRef: ElementRef) {
    this.elementRef = elementRef;
  }
  
  /**
   * Generates a default channel tag object.
   * 
   * @returns {Object} An object representing a channel tag with default properties:
   * - name: 'Channel'
   * - id: 'channel'
   * - email: ''
   * - online: false
   * - avatar: ''
   * - dm: []
   */
  generateChannelTag(): UserInterface {
    return { type: 'user', name: 'Channel', id: 'channel', email: '', online: false, avatar: '', dm: [] };
  }




  /**
   * Sets the focus on a content editable element by selecting all of its content.
   * This is necessary because calling focus() on a content editable element does
   * not actually set the caret to the end of the element as expected.
   * @param focusElement The content editable element to set the focus on.
   */
  setFocusContentEditable(focusElement: HTMLElement) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(focusElement);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }


  /**
   * Sets the focus on a non-editable input field by setting the selectionStart and
   * selectionEnd properties to the length of the input field's value. This ensures
   * that the caret is visible at the end of the input field.
   * @param focusElement The input field element to set the focus on.
   */
  setFocusInput(focusElement: HTMLElement) {
    (focusElement as HTMLInputElement).selectionStart = (focusElement as HTMLInputElement).value.length;
    (focusElement as HTMLInputElement).selectionEnd = (focusElement as HTMLInputElement).value.length;
  }




  /**
   * Sets the focus on either the tag search input or the message content based on the showTagSearch parameter.
   * If the active element's ID is part of the excludedTags array, the focus is not set.
   * @param showTagSearch If true, sets focus on the tag search input. Otherwise, sets focus on the message content.
   */
  setFocus(showTagSearch: boolean) {
    let focusElement = this.getFocusElement(showTagSearch);
    if (!focusElement) return;
    if (this.isExcludedId()) {
      focusElement = document.activeElement as HTMLElement;
    }
    focusElement.focus();
    if (focusElement.isContentEditable) this.setFocusContentEditable(focusElement);
    else if ('selectionStart' in focusElement) this.setFocusInput(focusElement);
  }


  /**
   * Checks if the currently active element's ID is part of the excluded tags.
   * This prevents setting focus on elements with IDs that are in the excludedTags array.
   * 
   * @returns {boolean} True if the active element's ID is included in the excludedTags, otherwise false.
   */
  isExcludedId(): boolean {
    return this.excludedTags.some(id => document.activeElement?.id.includes(id));
  }



  /**
   * Gets the element that should receive focus based on the showTagSearch parameter.
   * If showTagSearch is true, the tag search input is returned. Otherwise, the message content
   * is returned. If the thread is open, the IDs are 'tag-search-input-thread' and 'messageContentThread',
   * otherwise, they are 'tag-search-input' and 'messageContent'.
   * 
   * @param showTagSearch If true, the tag search input is returned. Otherwise, the message content is returned.
   * @returns The focus element or null if the element does not exist.
   */
  getFocusElement(showTagSearch: boolean): HTMLElement | null {
    const isThreadOpen = this.storage.currentUser.threadOpen;
    if (showTagSearch) return this.elementRef.nativeElement.querySelector(
      isThreadOpen ? '#tag-search-input-thread' : '#tag-search-input'
    );
    return this.elementRef.nativeElement.querySelector(
      isThreadOpen ? '#messageContentThread' : '#messageContent'
    );
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
}
