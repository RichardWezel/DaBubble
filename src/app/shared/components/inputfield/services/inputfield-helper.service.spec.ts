import { TestBed } from '@angular/core/testing';

import { InputfieldHelperService } from './inputfield-helper.service';

describe('InputfieldHelperService', () => {
  let service: InputfieldHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputfieldHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
