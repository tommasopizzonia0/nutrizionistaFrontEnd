import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMagnifyingGlass, faPlus, faArrowRight, faTriangleExclamation, faChevronLeft, faChevronRight,
  faDumbbell, faWheatAlt, faDroplet, faFire, faFilter, faChevronDown, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Subscription, combineLatest, of, timer } from 'rxjs';
import { catchError, debounce, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoDaEvitareDto } from '../../dto/alimento-da-evitare.dto';
import { AlimentoService } from '../../services/alimento-service';

@Component({
  selector: 'app-catalogo-alimenti',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './catalogo-alimenti.html',
  styleUrl: './catalogo-alimenti.css',
})
export class CatalogoAlimenti implements OnInit, OnDestroy {
  /** Nome del pasto attualmente espanso/selezionato */
  @Input() pastoEspanso?: string;

  /** Indica se la scheda è stata salvata (ha un ID valido) */
  @Input() schedaSalvata = false;

  /** Se true, usa tema scuro */
  @Input() isDarkMode = false;

  /** Feature 10: Alimenti da evitare */
  @Input() alimentiDaEvitare: AlimentoDaEvitareDto[] = [];

  /** Drawer mode: quando usato come slide panel */
  @Input() isDrawer = false;

  /** Emesso quando l'utente clicca su un alimento per aggiungerlo */
  @Output() alimentoSelezionato = new EventEmitter<AlimentoBaseDto>();
  @Output() alimentoDettaglioRichiesto = new EventEmitter<AlimentoBaseDto>();
  @Output() closeRequested = new EventEmitter<void>();

  private alimentoService = inject(AlimentoService);
  private cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  alimentiDisponibili: AlimentoBaseDto[] = [];
  loadingAlimenti = false;
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  private allAlimentiCache: AlimentoBaseDto[] = [];
  private allAlimentiLoaded = false;
  private searchResultsAll: AlimentoBaseDto[] = [];
  private readonly query$ = new BehaviorSubject<string>('');
  private readonly page$ = new BehaviorSubject<number>(0);
  private readonly filterChanged$ = new BehaviorSubject<void>(undefined);
  private readonly subscriptions: Subscription[] = [];

  protected readonly icons = {
    search: faMagnifyingGlass,
    plus: faPlus,
    arrowRight: faArrowRight,
    warning: faTriangleExclamation,
    chevronLeft: faChevronLeft,
    chevronRight: faChevronRight,
    dumbbell: faDumbbell,
    wheat: faWheatAlt,
    droplet: faDroplet,
    fire: faFire,
    filter: faFilter,
    chevronDown: faChevronDown,
    xmark: faXmark
  };

  /** Feature 9: Category filter */
  categoriaFiltro = '';
  private categorieGlobali: string[] = [];
  isEvitarePanelOpen = false;

  /** Feature 9: Extract unique categories from available foods */
  get categorie(): string[] {
    return this.categorieGlobali;
  }

  /** Filtered foods — filtering now happens inside the subscribe, this just returns the result */
  get alimentiFiltrati(): AlimentoBaseDto[] {
    return this.alimentiDisponibili;
  }

  ngOnInit(): void {
    const debouncedQuery$ = this.query$.pipe(
      map(q => (q ?? '').trim()),
      debounce(q => q ? timer(250) : timer(0)),
      distinctUntilChanged()
    );

    this.subscriptions.push(
      combineLatest([debouncedQuery$, this.page$, this.filterChanged$]).pipe(
        tap(() => {
          this.loadingAlimenti = true;
          this.cdr.detectChanges();
        }),
        switchMap(([query, page]) => {
          // Se c'è una query di ricerca, il search torna già tutto
          if (query) {
            return this.alimentoService.search(query).pipe(
              map(items => ({
                mode: 'search' as const, page,
                items: this.sortByNome((items || []).slice())
              })),
              catchError(() => of({ mode: 'search' as const, page: 0, items: [] as AlimentoBaseDto[] }))
            );
          }

          // Se c'è un filtro categoria attivo → carica TUTTI e filtra client-side
          if (this.categoriaFiltro) {
            if (this.allAlimentiLoaded) {
              return of({ mode: 'all' as const, page, items: this.allAlimentiCache });
            }
            return this.alimentoService.getAll(0, 5000).pipe(
              map(resp => {
                this.allAlimentiCache = (resp.contenuto || []).slice();
                this.allAlimentiLoaded = true;
                return { mode: 'all' as const, page, items: this.allAlimentiCache };
              }),
              catchError(() => of({ mode: 'all' as const, page: 0, items: [] as AlimentoBaseDto[] }))
            );
          }

          // Nessun filtro → paginazione server normale
          return this.alimentoService.getAll(page, this.pageSize).pipe(
            map(resp => ({
              mode: 'paged' as const, page: resp.numeroPagina,
              totalPages: resp.totalePagine, totalElements: resp.totaleElementi,
              items: (resp.contenuto || []).slice()
            })),
            catchError(() => of({
              mode: 'paged' as const, page: 0, totalPages: 0, totalElements: 0, items: [] as AlimentoBaseDto[]
            }))
          );
        })
      ).subscribe((state: any) => {
        if (state.mode === 'paged') {
          // Server-paginated, nessun filtro
          this.currentPage = state.page;
          this.totalPages = state.totalPages;
          this.totalElements = state.totalElements;
          this.searchResultsAll = [];
          this.alimentiDisponibili = state.items;
        } else {
          // 'search' o 'all' → filtra client-side e pagina
          let filtered = state.items as AlimentoBaseDto[];

          // Applica filtro categoria
          if (this.categoriaFiltro) {
            filtered = filtered.filter((a: AlimentoBaseDto) => a.categoria === this.categoriaFiltro);
          }

          this.searchResultsAll = filtered;
          this.totalElements = filtered.length;
          this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
          this.currentPage = Math.max(0, Math.min(state.page, this.totalPages - 1));
          const start = this.currentPage * this.pageSize;
          this.alimentiDisponibili = filtered.slice(start, start + this.pageSize);
        }

        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      })
    );

    this.query$.next(this.searchQuery);
    this.page$.next(0);

    // Carica elenco globale categorie
    this.alimentoService.getCategorie().pipe(
      map(cats => (cats || []).slice().sort((a, b) => a.localeCompare(b, 'it'))),
      catchError(() => {
        // Endpoint categorie non disponibile → carica TUTTI gli alimenti per estrarre le categorie
        return this.alimentoService.getAll(0, 5000).pipe(
          map(resp => {
            const items = resp.contenuto || [];
            this.allAlimentiCache = items.slice();
            this.allAlimentiLoaded = true;
            return this.extractCategories(items);
          }),
          catchError(() => of([] as string[]))
        );
      })
    ).subscribe(cats => {
      this.categorieGlobali = cats;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /**
   * Ricerca alimenti - senza limite minimo di caratteri
   */
  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 0;
    this.page$.next(0);
    this.query$.next(value);
  }

  cambiaPagina(page: number): void {
    const next = Math.max(0, Math.min(page, Math.max(0, this.totalPages - 1)));
    this.page$.next(next);
  }

  get paginaCorrente(): number {
    return this.currentPage + 1;
  }

  private sortByNome(items: AlimentoBaseDto[]): AlimentoBaseDto[] {
    return items.sort((a, b) => {
      const an = (a?.nome || '').trim();
      const bn = (b?.nome || '').trim();
      return an.localeCompare(bn, 'it', { sensitivity: 'base', ignorePunctuation: true, numeric: true });
    });
  }

  /**
   * Gestisce il click su un alimento
   */
  onClickAlimento(alimento: AlimentoBaseDto): void {
    this.alimentoDettaglioRichiesto.emit(alimento);
  }

  onAddAlimento(alimento: AlimentoBaseDto, event: Event): void {
    event.stopPropagation();
    this.alimentoSelezionato.emit(alimento);
  }

  onCategoriaChange(value: string): void {
    this.categoriaFiltro = value || '';
    this.currentPage = 0;
    this.page$.next(0);
    this.filterChanged$.next();
  }

  private extractCategories(items: AlimentoBaseDto[]): string[] {
    const cats = new Set<string>();
    for (const a of items) {
      if (a.categoria) cats.add(a.categoria);
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b, 'it'));
  }
}
