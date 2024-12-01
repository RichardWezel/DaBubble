import { inject } from '@angular/core';
import { TextFormatterDirective } from './text-formatter.directive';
import { InputfieldComponent } from '../components/inputfield/inputfield.component';

describe('TextFormatterDirective', () => {
  it('should create an instance', () => {
    const directive = new TextFormatterDirective(inject(InputfieldComponent));
    expect(directive).toBeTruthy();
  });
});
