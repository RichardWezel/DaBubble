import { TestBed } from '@angular/core/testing';

import { InputEventsService } from './input-events.service';

describe('InputEventsService', () => {
  let service: InputEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InputEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
