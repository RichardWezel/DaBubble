import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputEventsService {


  constructor() { }


  /**
   * Determines if the target element is either the message content or the thread message content.
   * @param {HTMLElement} targetElement - The element to check.
   * @returns {boolean} True if the target element is either the message content or the thread message content, otherwise false.
   */
  isInsideMessageContent(targetElement: HTMLElement): boolean {
    return targetElement.id === 'messageContent' || targetElement.id === 'messageContentThread' || targetElement.id === 'editMessage'
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
    if ((this.isTagMessage(previousElement) || this.isThumbnailMessage(previousElement)) && this.isCursorAfterZeroWidthSpace(currentNode, offset)) {
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
   * Determines if the given HTML element is a thumbnail message.
   * A thumbnail message is defined as a <div> element with the class 'thumbnail'.
   * @param {HTMLElement} element - The HTML element to check.
   * @returns {boolean} True if the element is a thumbnail message, otherwise false.
   */
  isThumbnailMessage(element: HTMLElement): boolean {
    return element?.tagName === 'DIV' && element.classList.contains('file-thumbnail');
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
   * Checks if the given key event is a send button event.
   * @param {KeyboardEvent} event The event object.
   * @returns {boolean} True if the event is a send button event, false otherwise.
   */
  isSendButtonAndTagSearch(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === 'NumpadEnter' || event.key === 'Tab';
  }
}
