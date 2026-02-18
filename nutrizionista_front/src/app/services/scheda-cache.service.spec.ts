import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SchedaDto } from '../dto/scheda.dto';
import { SchedaCacheService } from './scheda-cache.service';
import { SchedaService } from './scheda-service';

class RouterStub {
  events = new Subject<any>();
}

describe('SchedaCacheService', () => {
  let cache: SchedaCacheService;
  let schedaService: { getById: any };
  let router: RouterStub;

  beforeEach(() => {
    router = new RouterStub();
    schedaService = {
      getById: (id: number) => of({ id, nome: 'S', attiva: true, dataCreazione: '2026-01-01', pasti: [] } as any as SchedaDto)
    };

    TestBed.configureTestingModule({
      providers: [
        SchedaCacheService,
        { provide: SchedaService, useValue: schedaService },
        { provide: Router, useValue: router }
      ]
    });

    cache = TestBed.inject(SchedaCacheService);
  });

  it('should be created', () => {
    expect(cache).toBeTruthy();
  });

  it('returns cached value without refetching', async () => {
    let calls = 0;
    schedaService.getById = (id: number) => {
      calls++;
      return of({ id, nome: 'S', attiva: true, dataCreazione: '2026-01-01', pasti: [] } as any as SchedaDto);
    };

    await new Promise<void>((resolve) => {
      cache.getByIdCached(1).subscribe(() => resolve());
    });

    await new Promise<void>((resolve) => {
      cache.getByIdCached(1).subscribe((r) => {
        expect(r.fromCache).toBe(true);
        resolve();
      });
    });

    expect(calls).toBe(1);
  });

  it('clears cache on navigation to different page', async () => {
    let calls = 0;
    schedaService.getById = (id: number) => {
      calls++;
      return of({ id, nome: 'S', attiva: true, dataCreazione: '2026-01-01', pasti: [] } as any as SchedaDto);
    };

    await new Promise<void>((resolve) => {
      cache.getByIdCached(2).subscribe(() => resolve());
    });

    router.events.next(new NavigationStart(1, '/home'));

    await new Promise<void>((resolve) => {
      cache.getByIdCached(2).subscribe(() => resolve());
    });

    expect(calls).toBe(2);
  });
});

