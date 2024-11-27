import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { InputfieldComponent } from '../components/inputfield/inputfield.component';


@Directive({
  selector: '[appTextFormatter]',
  standalone: true,
})
export class TextFormatterDirective {
  elementRef: ElementRef = inject(ElementRef)

  constructor(private inputElement: InputfieldComponent) {
  }


  addTag(text: string) {
    const formattedText = ` <span contentEditable="false" class="tag">&#64;${text}</span> `;
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    console.log(message);
    message.innerHTML += formattedText;
    let messageContent = message.innerHTML;
    let lastIndex = messageContent.lastIndexOf('<br>');
    if (lastIndex !== -1) messageContent = messageContent.slice(0, lastIndex);
    message.innerHTML = messageContent;
    this.inputElement.startInput = true;
  }

}
