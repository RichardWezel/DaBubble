import { TestBed } from '@angular/core/testing';

import { GetUserNameService } from './get-user-name.service';

describe('GetUserNameService', () => {
  let service: GetUserNameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetUserNameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
