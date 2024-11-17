import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { InputfieldComponent } from '../inputfield/inputfield.component';


@Component({
  selector: 'app-emoji-selector',
  standalone: true,
  imports: [FormsModule, PickerModule],
  templateUrl: './emoji-selector.component.html',
  styleUrl: './emoji-selector.component.scss'
})
export class EmojiSelectorComponent {
  message: string = '';
  @Input() inputField?: InputfieldComponent;

  constructor() { }

  addEmojiToMessage(event: any) {

    console.log(event);
    this.message += event.emoji.native;
    this.inputField?.addEmoji(event.emoji.native);
  }

}
