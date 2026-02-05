import { TestBed } from '@angular/core/testing';

import { AppuntamentiService } from './appuntamenti.service';

describe('AppuntamentiService', () => {
  let service: AppuntamentiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppuntamentiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
