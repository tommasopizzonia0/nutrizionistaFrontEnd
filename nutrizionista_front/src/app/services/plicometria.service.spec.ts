import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PlicometrieApiService } from './plicometria.service';

describe('PlicometrieApiService', () => {
  let service: PlicometrieApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PlicometrieApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
