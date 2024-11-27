import { TestBed } from '@angular/core/testing';

import { OpenUserProfileService } from './open-user-profile.service';

describe('OpenUserProfileService', () => {
  let service: OpenUserProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenUserProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
