import { TestBed } from '@angular/core/testing';

import { AgendaStateService } from './agenda-state.service';

describe('AgendaStateService', () => {
  let service: AgendaStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgendaStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
