import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AlimentoService } from './alimento-service';

describe('AlimentoService', () => {
  let service: AlimentoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AlimentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('chiama dettaglio per id', () => {
    service.getDettaglio(7).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/alimenti_base/7/dettaglio');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 });
  });
});
