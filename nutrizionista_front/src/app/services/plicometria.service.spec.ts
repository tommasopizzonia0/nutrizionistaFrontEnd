import { TestBed } from '@angular/core/testing';

import { PlicometriaService } from './plicometria.service';

describe('PlicometriaService', () => {
  let service: PlicometriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlicometriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
