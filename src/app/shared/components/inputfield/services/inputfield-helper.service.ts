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
  uid = inject(UidService);

  excludedTags: string[] = ['newMessageInput', 'searchbar', 'channel-name', 'channel-description', 'profile-name', 'profile-email', 'editMessage', 'newChannelMemberInput', 'result-dropdown', 'emoji-mart-search-1', 'password'];


  constructor() { }


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
   * Checks if the currently active element's ID is part of the excluded tags.
   * This prevents setting focus on elements with IDs that are in the excludedTags array.
   * 
   * @returns {boolean} True if the active element's ID is included in the excludedTags, otherwise false.
   */
  isExcludedId(): boolean {
    return this.excludedTags.some(id => document.activeElement?.id.includes(id));
  }


  /**
 * Scrolls the view to the post element with the specified ID after a delay.
 * If the element is found, it smoothly scrolls to its position at the start of the view.
 * If the element is not found, a warning is logged to the console.
 * 
 * @param {string} postId - The ID of the post element to scroll to.
 */
  scrollToPost(postId: string) {
    setTimeout(() => {
      const postElement = document.getElementById(postId);
      if (postElement) postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else console.warn(`Element mit ID ${postId} nicht gefunden.`);
    }, 100);
  }


  /**
  * Generates a new post from the current message content.
  * 
  * @returns {PostInterface} A new post object with the current message content.
  */
  generateNewPost(message: string): PostInterface {
    return {
      text: message,
      timestamp: new Date().getTime(),
      author: this.storage.currentUser.id || '',
      id: this.uid.generateUid(),
      thread: false,
      emoticons: [],
      threadMsg: [],
    }
  }


  /**
   * Checks if any element in the given path has an ID or a class name that includes the string 'thread'.
   * 
   * @param {any} path - The path to check, which is an array of elements.
   * @returns {boolean} True if any element in the path has an ID or class name that includes 'thread', otherwise false.
   */
  hasThreadInPath(path: any): boolean {
    const hasThreadInPath = path.some((element: any) => {
      let thread;
      if (!thread && element.id && element.id.toLowerCase().includes('thread')) thread = true;
      if (!thread && element.classList) element.classList.forEach((className: string) => {
        if (className.toLowerCase().includes('thread')) {
          thread = true;
        }
      })
      return thread;
    });
    return hasThreadInPath;
  }
}
