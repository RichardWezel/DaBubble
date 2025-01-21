import { Component, Input } from '@angular/core';
import { NgFor, NgIf, } from '@angular/common';
@Component({
  selector: 'app-result-dropdown',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './result-dropdown.component.html',
  styleUrl: './result-dropdown.component.scss'
})
export class ResultDropdownComponent {

  @Input() userInput: string = "";

  isChannel() {
    return this.userInput.startsWith('#');
  }

  isUser() {
    return this.userInput.startsWith('@');
  }
}
