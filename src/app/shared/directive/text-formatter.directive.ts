import { Directive, ElementRef, inject } from '@angular/core';
import { InputfieldComponent } from '../components/inputfield/inputfield.component';
import { UserInterface } from '../interfaces/user.interface';


@Directive({
  selector: '[appTextFormatter]',
  standalone: true,
})
export class TextFormatterDirective {
  elementRef: ElementRef = inject(ElementRef)

  constructor(private inputElement: InputfieldComponent) {
  }


  addTag(user: UserInterface) {
    const formattedText = `<span contentEditable="false" class="tagMessage">&#64;${user.name}</span>&#8203`;
    let message = this.elementRef.nativeElement.classList.contains('message-content') ? this.elementRef.nativeElement : this.elementRef.nativeElement.querySelector('.message-content');
    message.innerHTML += formattedText + '';
    let messageContent = message.innerHTML;
    let lastIndex = messageContent.lastIndexOf('<br>');
    if (lastIndex !== -1) messageContent = messageContent.slice(0, lastIndex);
    message.innerHTML = messageContent;
    this.inputElement.startInput = true;
    this.inputElement.toggleTagSearch();
  }

}
