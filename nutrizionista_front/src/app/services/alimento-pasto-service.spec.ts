import { TestBed } from '@angular/core/testing';

import { AlimentoPastoService } from './alimento-pasto-service';

describe('AlimentoPastoService', () => {
  let service: AlimentoPastoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlimentoPastoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
