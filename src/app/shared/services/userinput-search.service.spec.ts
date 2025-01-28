import { TestBed } from '@angular/core/testing';

import { UserinputSearchService } from './userinput-search.service';

describe('UserinputSearchService', () => {
  let service: UserinputSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserinputSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
