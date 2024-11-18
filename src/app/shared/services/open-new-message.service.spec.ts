import { TestBed } from '@angular/core/testing';

import { OpenNewMessageService } from './open-new-message.service';

describe('OpenNewMessageService', () => {
  let service: OpenNewMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenNewMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
