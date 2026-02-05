import { TestBed } from '@angular/core/testing';

import { AlimentoDaEvitareService } from './alimento-da-evitare-service';

describe('AlimentoDaEvitareService', () => {
  let service: AlimentoDaEvitareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlimentoDaEvitareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
