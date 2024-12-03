import { TestBed } from '@angular/core/testing';

import { OpenCloseDialogService } from './open-close-dialog.service';

describe('OpenCloseDialogService', () => {
  let service: OpenCloseDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenCloseDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
