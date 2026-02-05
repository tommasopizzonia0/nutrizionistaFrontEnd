import { TestBed } from '@angular/core/testing';

import { PastoService } from './pasto-service';

describe('PastoService', () => {
  let service: PastoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PastoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
