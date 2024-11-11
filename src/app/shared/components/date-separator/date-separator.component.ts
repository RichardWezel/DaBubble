import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-date-separator',
  standalone: true,
  imports: [],
  templateUrl: './date-separator.component.html',
  styleUrl: './date-separator.component.scss'
})
export class DateSeparatorComponent {
  @Input() date: string = '';
}
