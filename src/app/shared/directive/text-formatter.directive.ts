import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appTextFormatter]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextFormatterDirective),
      multi: true
    }
  ]
})
export class TextFormatterDirective implements ControlValueAccessor {
  elementRef: ElementRef = inject(ElementRef)

  messageContent: Element = this.elementRef.nativeElement.querySelector('.message-content') || {};

  constructor() {
  }

  ngAfterContentInit(): void {
    //Called after ngOnInit when the component's or directive's content has been initialized.
    //Add 'implements AfterContentInit' to the class.
    this.messageContent = this.elementRef.nativeElement.querySelector('.message-content');
  }

  writeValue(value: any): void {
    this.messageContent.innerHTML = value;
  }

  registerOnChange(fn: any): void {
    this.elementRef.nativeElement.addEventListener('input', fn);
  }

  registerOnTouched(fn: any): void {
    this.elementRef.nativeElement.addEventListener('blur', fn);
  }

  addTag(text: string) {
    const formattedText = `<span class="tag">@${text}</span>`;
    this.messageContent.innerHTML += formattedText;
    let messageContent = this.messageContent.innerHTML;
    let lastIndex = messageContent.lastIndexOf('<br>');
    if (lastIndex !== -1) messageContent = messageContent.slice(0, lastIndex);
    this.messageContent.innerHTML = messageContent;
  }

}
