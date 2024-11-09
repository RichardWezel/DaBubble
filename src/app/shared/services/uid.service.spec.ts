import { TestBed } from '@angular/core/testing';

import { UidService } from './uid.service';

describe('UidService', () => {
  let service: UidService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UidService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
