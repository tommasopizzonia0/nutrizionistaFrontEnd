import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Observable, catchError, filter, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { SchedaDto } from '../dto/scheda.dto';
import { SchedaService } from './scheda-service';

export interface SchedaCacheResult {
  scheda: SchedaDto;
  fromCache: boolean;
}

interface CacheEntry {
  value?: SchedaDto;
  inFlight$?: Observable<SchedaDto>;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class SchedaCacheService {
  private readonly maxEntries = 25;
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly cache = new Map<number, CacheEntry>();
  private lastClientPath?: string;

  constructor(
    private readonly schedaService: SchedaService,
    private readonly router: Router
  ) {
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart)
      )
      .subscribe((e) => this.onNavigationStart(e.url));
  }

  getByIdCached(id: number): Observable<SchedaCacheResult> {
    const now = Date.now();
    const entry = this.cache.get(id);
    if (entry && now - entry.createdAt > this.ttlMs) {
      this.cache.delete(id);
    }

    const fresh = this.cache.get(id);
    if (fresh?.value && this.isSchedaValid(fresh.value)) {
      this.touch(id, fresh);
      return of({ scheda: fresh.value, fromCache: true });
    }

    if (fresh?.inFlight$) {
      this.touch(id, fresh);
      return fresh.inFlight$.pipe(map((scheda) => ({ scheda, fromCache: false })));
    }

    const newEntry: CacheEntry = fresh ?? { createdAt: now };
    newEntry.createdAt = now;
    this.cache.set(id, newEntry);
    this.touch(id, newEntry);
    this.evictIfNeeded();

    const inFlight$ = this.schedaService.getById(id).pipe(
      map((scheda) => {
        if (!this.isSchedaValid(scheda)) throw new Error('Scheda cache: response non valida');
        return scheda;
      }),
      map((scheda) => {
        const current = this.cache.get(id);
        if (current) {
          current.value = scheda;
          current.createdAt = Date.now();
          current.inFlight$ = undefined;
          this.touch(id, current);
        }
        return scheda;
      }),
      catchError((err) => {
        this.cache.delete(id);
        return throwError(() => err);
      }),
      finalize(() => {
        const current = this.cache.get(id);
        if (current) current.inFlight$ = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    newEntry.inFlight$ = inFlight$;
    return inFlight$.pipe(map((scheda) => ({ scheda, fromCache: false })));
  }

  isCached(id: number): boolean {
    const entry = this.cache.get(id);
    if (!entry?.value) return false;
    if (!this.isSchedaValid(entry.value)) return false;
    if (Date.now() - entry.createdAt > this.ttlMs) return false;
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(id: number): void {
    this.cache.delete(id);
  }

  private onNavigationStart(nextUrl: string): void {
    const nextPath = this.normalizePath(nextUrl);
    const nextClientPath = this.extractClientPath(nextPath);

    if (!this.lastClientPath) {
      this.lastClientPath = nextClientPath;
      if (!nextClientPath) this.clear();
      return;
    }

    if (this.lastClientPath !== nextClientPath) {
      this.clear();
    }

    this.lastClientPath = nextClientPath;
  }

  private extractClientPath(path: string): string | undefined {
    const m = path.match(/^\/clienti\/\d+$/);
    return m ? m[0] : undefined;
  }

  private normalizePath(url: string): string {
    const q = url.indexOf('?');
    const h = url.indexOf('#');
    const cut = Math.min(q === -1 ? url.length : q, h === -1 ? url.length : h);
    return url.slice(0, cut);
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value as number | undefined;
      if (oldestKey === undefined) return;
      this.cache.delete(oldestKey);
    }
  }

  private touch(id: number, entry: CacheEntry): void {
    this.cache.delete(id);
    this.cache.set(id, entry);
  }

  private isSchedaValid(scheda: SchedaDto | undefined): boolean {
    if (!scheda) return false;
    if (typeof scheda.id !== 'number') return false;
    if (!Array.isArray((scheda as any).pasti) && (scheda as any).pasti !== undefined) return false;
    return true;
  }
}

