import { TestBed } from '@angular/core/testing';

import { AuthorServiceTsService } from './author.service.ts.service';

describe('AuthorServiceTsService', () => {
  let service: AuthorServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthorServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
