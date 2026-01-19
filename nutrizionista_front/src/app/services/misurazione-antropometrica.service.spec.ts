import { TestBed } from '@angular/core/testing';

import { MisurazioneAntropometricaService } from './misurazione-antropometrica.service';

describe('MisurazioneAntropometricaService', () => {
  let service: MisurazioneAntropometricaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MisurazioneAntropometricaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
