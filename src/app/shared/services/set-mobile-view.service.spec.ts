import { TestBed } from '@angular/core/testing';

import { SetMobileViewService } from './set-mobile-view.service';

describe('SetMobileViewService', () => {
  let service: SetMobileViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetMobileViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
