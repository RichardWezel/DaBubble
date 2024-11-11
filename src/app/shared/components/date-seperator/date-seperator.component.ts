import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-date-seperator',
  standalone: true,
  imports: [],
  templateUrl: './date-seperator.component.html',
  styleUrl: './date-seperator.component.scss'
})
export class DateSeperatorComponent {
  @Input() date: string = '';
}
