import { Directive, ElementRef, inject, input } from '@angular/core';
import { InputfieldComponent } from '../components/inputfield/inputfield.component';
import { UserInterface } from '../interfaces/user.interface';
import { ChannelInterface } from '../interfaces/channel.interface';


@Directive({
  selector: '[appTextFormatter]',
  standalone: true,
})
export class TextFormatterDirective {
  elementRef: ElementRef = inject(ElementRef)

  constructor(private inputElement: InputfieldComponent) {
  }


  /**
   * Formats a given user's name as a tag and appends it to the messageContent
   * of the input field. It also removes any line breaks from the messageContent
   * and closes the search bar.
   *
   * @param user The user to be tagged
   */
  addTag(event: any, suggestion: UserInterface | ChannelInterface) {
    event.preventDefault();
    event.stopPropagation();
    let formattedText;
    if (suggestion.type === 'user') formattedText = `<span contentEditable="false" class="tagMessage">&#64;${suggestion.name}</span>&#8203`;
    else if (suggestion.type === 'channel') formattedText = `<span contentEditable="false" class="tagMessage">&#35;${suggestion.name}</span>&#8203`;
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    message.innerHTML += formattedText + '';
    message.innerHTML = this.clearLineBreak(message);
    this.closeSearch(event);
    this.inputElement.setFocus(event);
  }


  /**
   * Removes the last line break from the inner HTML of the given message element.
   *
   * @param message The HTMLElement containing the message content.
   * @returns The message content without the last line break.
   */
  clearLineBreak(message: HTMLElement) {
    let messageContent = message.innerHTML;
    messageContent = messageContent.replaceAll('<br>', '');
    return messageContent;
  }


  /**
   * Closes the search bar and sets startInput to true, which will re-enable
   * the input field.
   */
  closeSearch(event: any) {
    this.inputElement.startInput = true;
    this.inputElement.toggleTagSearch(event, false);
  }
}
