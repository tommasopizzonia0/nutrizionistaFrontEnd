import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMagnifyingGlass, faUtensils, faHeart, faBowlFood, faLightbulb,
  faPlus, faChartSimple, faScaleBalanced, faChevronLeft, faChevronRight,
  faFire, faDumbbell, faWheatAlt, faDroplet, faFilter, faXmark,
  faStar, faTrash, faEdit, faTags, faLeaf, faSeedling, faBan,
  faBolt, faEye, faArrowUp, faArrowDown, faCheck, faUser
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Subject, Subscription, combineLatest, of, timer, EMPTY } from 'rxjs';
import { catchError, debounce, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { MacroDto } from '../../dto/macro.dto';
import { PastoTemplateAlternativaDto, PastoTemplateDto, PastoTemplateItemDto, PastoTemplateUpsertDto } from '../../dto/pasto-template.dto';
import { RicettaDto } from '../../dto/ricetta.dto';
import { AlimentoService } from '../../services/alimento-service';
import { ThemeService } from '../../services/theme.service';
import { CatalogoAlimenti } from '../../components/catalogo-alimenti/catalogo-alimenti';
import { ModalAlimento } from '../../components/modal-alimento/modal-alimento';
import { ListaAlternativeTemplateComponent } from '../../components/lista-alternative-template/lista-alternative-template';
import { Chart } from 'chart.js/auto';

/* ─── Interfaces ─── */
interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface SmartTag {
  id: string;
  label: string;
  icon: any;
  active: boolean;
  filterFn: (a: AlimentoBaseDto) => boolean;
}

// RicettaSuggerita interface moved to ricetta.dto.ts

@Component({
  selector: 'app-alimenti-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, ModalAlimento, CatalogoAlimenti, ListaAlternativeTemplateComponent],
  templateUrl: './alimenti-page.html',
  styleUrl: './alimenti-page.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class AlimentiPageComponent implements OnInit, OnDestroy {

  private alimentoService = inject(AlimentoService);
  protected themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  isDarkMode = false;

  /* ─── Icons ─── */
  protected readonly icons = {
    search: faMagnifyingGlass, utensils: faUtensils, heart: faHeart,
    bowl: faBowlFood, lightbulb: faLightbulb, plus: faPlus,
    chart: faChartSimple, scale: faScaleBalanced, chevronLeft: faChevronLeft,
    chevronRight: faChevronRight, fire: faFire, dumbbell: faDumbbell,
    wheat: faWheatAlt, droplet: faDroplet, filter: faFilter,
    xmark: faXmark, star: faStar, trash: faTrash, edit: faEdit,
    tags: faTags, leaf: faLeaf, seedling: faSeedling, ban: faBan,
    bolt: faBolt, eye: faEye, arrowUp: faArrowUp, arrowDown: faArrowDown,
    check: faCheck, user: faUser
  };

  /* ─── Tabs ─── */
  tabs: TabItem[] = [
    { id: 'catalogo', label: 'Catalogo', icon: faUtensils },
    { id: 'imiei', label: 'I Miei Alimenti', icon: faUser },
    { id: 'preferiti', label: 'Preferiti', icon: faHeart },
    { id: 'pasti', label: 'Pasti Personalizzati', icon: faBowlFood },
    { id: 'ricette', label: 'Ricette Suggerite', icon: faLightbulb },
    { id: 'top', label: 'Più Utilizzati', icon: faChartSimple },
    { id: 'confronto', label: 'Confronto', icon: faScaleBalanced },
    { id: 'statistiche', label: 'Statistiche', icon: faChartSimple }
  ];
  activeTab = 'catalogo';
  showFormAggiungi = false;

  /* ─── CATALOGO ─── */
  searchQuery = '';
  alimentiDisponibili: AlimentoBaseDto[] = [];
  loadingAlimenti = false;
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;
  categoriaFiltro = '';
  categorieGlobali: string[] = [];
  private allAlimentiCache: AlimentoBaseDto[] = [];
  private allAlimentiLoaded = false;
  private searchResultsAll: AlimentoBaseDto[] = [];
  private readonly query$ = new BehaviorSubject<string>('');
  private readonly page$ = new BehaviorSubject<number>(0);
  private readonly filterChanged$ = new BehaviorSubject<void>(undefined);
  private readonly subscriptions: Subscription[] = [];

  /* ─── Smart Tags ─── */
  smartTags: SmartTag[] = [
    {
      id: 'high-protein', label: 'Alto Proteico', icon: faDumbbell, active: false,
      filterFn: (a) => (a.macroNutrienti?.proteine ?? 0) >= 20
    },
    {
      id: 'low-carb', label: 'Low Carb', icon: faWheatAlt, active: false,
      filterFn: (a) => (a.macroNutrienti?.carboidrati ?? 0) <= 10
    },
    {
      id: 'low-fat', label: 'Low Fat', icon: faDroplet, active: false,
      filterFn: (a) => (a.macroNutrienti?.grassi ?? 0) <= 5
    },
    {
      id: 'high-fiber', label: 'Ricco di Fibre', icon: faLeaf, active: false,
      filterFn: (a) => (a.macroNutrienti?.fibre ?? 0) >= 5
    },
    {
      id: 'low-cal', label: 'Basso Calorico', icon: faFire, active: false,
      filterFn: (a) => (a.macroNutrienti?.calorie ?? 9999) <= 100
    },
    {
      id: 'vegan', label: 'Vegano', icon: faSeedling, active: false,
      filterFn: (a) => {
        const cat = (a.categoria || '').toLowerCase();
        return cat.includes('verdur') || cat.includes('frutta') || cat.includes('legum')
          || cat.includes('cereal') || cat.includes('ortagg');
      }
    }
  ];

  /* ─── Modal dettaglio ─── */
  modalOpen = false;
  modalLoading = false;
  alimentoDettaglio?: AlimentoBaseDto;
  modalPastoTargetLabel?: string;
  modalQuantita = 100;
  modalWarning = '';
  private modalWarningTimer: ReturnType<typeof setTimeout> | null = null;

  /* ─── PREFERITI ─── */
  preferiti: AlimentoBaseDto[] = [];
  private readonly PREF_KEY = 'nutrizionista_alimenti_preferiti';

  /* ─── PASTI PERSONALIZZATI ─── */
  pastiTemplates: PastoTemplateDto[] = [];
  private readonly PASTI_KEY = 'nutrizionista_pasti_templates';
  nuovoPastoNome = '';
  nuovoPastoDescrizione = '';
  pastoInModifica: PastoTemplateDto | null = null;
  loadingPastiTemplates = false;
  pastiTemplatesBackendAvailable = false;
  catalogoPastiDrawerOpen = false;
  private readonly pastoTemplateSave$ = new Subject<void>();

  /* ─── RICETTE SUGGERITE ─── */
  ricetteSuggerite: RicettaDto[] = [];
  loadingRicette = false;
  ricettaImportSuccess: number | null = null; // id della ricetta importata
  private ricettaSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  /* ─── AGGIUNGI ALIMENTO ─── */
  nuovoAlimento: {
    nome: string; categoria: string;
    calorie: number | null; proteine: number | null; carboidrati: number | null; grassi: number | null;
    fibre: number | null; zuccheri: number | null; grassiSaturi: number | null;
    misuraInGrammi: number;
  } = this.resetNuovoAlimento();
  creatingAlimento = false;
  creazioneSuccesso = false;
  creazioneErrore = '';

  /* ─── PIÙ UTILIZZATI ─── */
  topAlimenti: AlimentoBaseDto[] = [];
  private readonly TOP_KEY = 'nutrizionista_top_alimenti';

  /* ─── CONFRONTO ─── */
  confrontoSearch = '';
  confrontoResults: AlimentoBaseDto[] = [];
  confrontoLoading = false;
  confrontoSelezionati: AlimentoBaseDto[] = [];

  /* ─── STATISTICHE ─── */
  statCategorie: { categoria: string; count: number; pct: number }[] = [];
  statTotaleAlimenti = 0;
  statMacroMedi = { calorie: 0, proteine: 0, carboidrati: 0, grassi: 0 };
  statTopProteine: AlimentoBaseDto[] = [];
  statTopFibre: AlimentoBaseDto[] = [];
  loadingStats = false;

  /* ─── Lifecycle ─── */
  ngOnInit(): void {
    this.initCatalogo();
    this.loadPreferiti();
    this.initPastoTemplateAutosave();
    this.loadRicette();
    this.loadTopAlimenti();
    this.subscriptions.push(
      this.themeService.isDarkMode$.subscribe(isDark => {
        this.isDarkMode = !!isDark;
        this.updateTemplateMacroChart();
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /* ═══════════════════════════════════════════
     TAB MANAGEMENT
  ═══════════════════════════════════════════ */
  setTab(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'statistiche' && this.statTotaleAlimenti === 0) {
      this.loadStatistiche();
    }
    if (tabId === 'imiei' && !this.allAlimentiLoaded) {
      this.loadAllAlimentiAsCache();
    }
  }

  private loadAllAlimentiAsCache(): void {
    if (this.allAlimentiLoaded) return;
    this.loadingAlimenti = true;
    this.alimentoService.getAll(0, 5000).subscribe({
      next: (resp) => {
        this.allAlimentiCache = (resp.contenuto || []).slice();
        this.allAlimentiLoaded = true;
        this.loadingAlimenti = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAlimenti = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  get mieiAlimenti(): AlimentoBaseDto[] {
    if (!this.allAlimentiLoaded) return [];
    return this.allAlimentiCache.filter(a => a.personale);
  }

  /* ═══════════════════════════════════════════
     CATALOGO (Sezione 1)
     Quando è attivo un filtro (categoria o smart tag)
     carichiamo TUTTI gli alimenti e filtriamo/paginiamo
     client-side. Senza filtri, usiamo la paginazione server.
  ═══════════════════════════════════════════ */
  private get hasActiveFilters(): boolean {
    return !!this.categoriaFiltro || this.smartTags.some(t => t.active);
  }

  private initCatalogo(): void {
    const debouncedQuery$ = this.query$.pipe(
      map(q => (q ?? '').trim()),
      debounce(q => q ? timer(300) : timer(0)),
      distinctUntilChanged()
    );

    this.subscriptions.push(
      combineLatest([debouncedQuery$, this.page$, this.filterChanged$]).pipe(
        tap(() => { this.loadingAlimenti = true; this.cdr.detectChanges(); }),
        switchMap(([query, page]) => {
          // Se c'è una query di ricerca, il search torna già tutto
          if (query) {
            return this.alimentoService.search(query).pipe(
              map(items => ({
                mode: 'search' as const, page,
                items: (items || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'it'))
              })),
              catchError(() => of({ mode: 'search' as const, page: 0, items: [] as AlimentoBaseDto[] }))
            );
          }

          // Se ci sono filtri attivi → carica TUTTO e filtra client-side
          if (this.hasActiveFilters) {
            // Usa cache se già caricato
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
            catchError(() => of({ mode: 'paged' as const, page: 0, totalPages: 0, totalElements: 0, items: [] as AlimentoBaseDto[] }))
          );
        })
      ).subscribe((state: any) => {
        if (state.mode === 'paged') {
          // Server-paginated, no filters
          this.currentPage = state.page;
          this.totalPages = state.totalPages;
          this.totalElements = state.totalElements;
          this.searchResultsAll = [];
          this.alimentiDisponibili = state.items;
        } else {
          // 'search' or 'all' → filtra client-side e pagina
          let filtered = state.items as AlimentoBaseDto[];

          // Applica filtro categoria
          if (this.categoriaFiltro) {
            filtered = filtered.filter((a: AlimentoBaseDto) => a.categoria === this.categoriaFiltro);
          }
          // Applica smart tags
          const activeTags = this.smartTags.filter(t => t.active);
          if (activeTags.length > 0) {
            filtered = filtered.filter((a: AlimentoBaseDto) => activeTags.every(t => t.filterFn(a)));
          }

          this.searchResultsAll = filtered;
          this.totalElements = filtered.length;
          this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
          this.currentPage = Math.max(0, Math.min(state.page, this.totalPages - 1));
          const start = this.currentPage * this.pageSize;
          this.alimentiDisponibili = filtered.slice(start, start + this.pageSize);
        }
        this.loadingAlimenti = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
    );

    this.query$.next('');
    this.page$.next(0);

    this.alimentoService.getCategorie().pipe(
      map(cats => (cats || []).slice().sort((a, b) => a.localeCompare(b, 'it'))),
      catchError(() => {
        // Endpoint categorie non disponibile → carica TUTTI gli alimenti per estrarre le categorie
        return this.alimentoService.getAll(0, 5000).pipe(
          map(resp => {
            const items = resp.contenuto || [];
            this.allAlimentiCache = items.slice();
            this.allAlimentiLoaded = true;
            const cats = new Set<string>();
            for (const a of items) { if (a.categoria) cats.add(a.categoria); }
            return Array.from(cats).sort((a, b) => a.localeCompare(b, 'it'));
          }),
          catchError(() => of([] as string[]))
        );
      })
    ).subscribe(cats => { this.categorieGlobali = cats; this.cdr.markForCheck(); });   // ← tracked inside subscriptions via push below
    // Note: the combineLatest sub above is tracked; this fire-and-forget is acceptable since
    // getCategorie completes after the first emission (HTTP observable). No leak risk.
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 0;
    this.page$.next(0);
    this.query$.next(value);
  }

  onCategoriaChange(value: string): void {
    this.categoriaFiltro = value || '';
    this.currentPage = 0;
    this.page$.next(0);
    this.filterChanged$.next();
  }

  cambiaPagina(page: number): void {
    this.page$.next(Math.max(0, Math.min(page, Math.max(0, this.totalPages - 1))));
  }

  get paginaCorrente(): number { return this.currentPage + 1; }

  toggleTag(tag: SmartTag): void {
    tag.active = !tag.active;
    this.currentPage = 0;
    this.page$.next(0);
    this.filterChanged$.next();
  }

  /** No more client-side getter filtering — done in the subscribe */
  get alimentiFiltrati(): AlimentoBaseDto[] {
    return this.alimentiDisponibili;
  }

  clearAllTags(): void {
    this.smartTags.forEach(t => t.active = false);
    this.currentPage = 0;
    this.page$.next(0);
    this.filterChanged$.next();
  }

  get hasActiveTags(): boolean {
    return this.smartTags.some(t => t.active);
  }

  /* ─── Modal dettaglio ─── */
  openDettaglio(alimento: AlimentoBaseDto): void {
    this.modalLoading = true;
    this.modalOpen = true;
    this.alimentoDettaglio = alimento;
    this.modalPastoTargetLabel = this.pastoInModifica?.nome || undefined;
    this.modalQuantita = 100;
    this.modalWarning = '';
    if (alimento.id) {
      this.alimentoService.getDettaglio(alimento.id).pipe(
        catchError(() => of(alimento))
      ).subscribe(detail => {
        this.alimentoDettaglio = detail;
        this.modalLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    } else {
      this.modalLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  onModalClosed(): void {
    this.modalOpen = false;
    this.alimentoDettaglio = undefined;
    this.modalPastoTargetLabel = undefined;
    this.modalWarning = '';
  }

  onModalAddRequested(event: { alimento: AlimentoBaseDto; quantita: number }): void {
    if (!this.pastoInModifica) return;
    const alimento = event?.alimento;
    if (!alimento?.id) return;

    const exists = this.pastoInModifica.alimenti.some(a => a.alimento.id === alimento.id);
    if (exists) {
      this.setModalWarning('Alimento già presente nel template.');
      return;
    }

    const q = Math.max(1, Math.round(Number(event?.quantita || 100)));
    this.pastoInModifica.alimenti.push({
      alimento: { ...alimento },
      quantita: q,
      nomeCustom: null,
      nomeVisualizzato: alimento.nome,
      alternative: []
    });
    this.pastoTemplateSave$.next();
    this.updateTemplateMacroChart();
    this.modalOpen = false;
    this.alimentoDettaglio = undefined;
    this.modalWarning = '';
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  private setModalWarning(message: string): void {
    this.modalWarning = message;
    if (this.modalWarningTimer) clearTimeout(this.modalWarningTimer);
    this.modalWarningTimer = setTimeout(() => {
      this.modalWarning = '';
      this.cdr.detectChanges();
    }, 2500);
    this.cdr.detectChanges();
  }

  /* ═══════════════════════════════════════════
     PREFERITI (Sezione 2)
  ═══════════════════════════════════════════ */
  private loadPreferiti(): void {
    this.alimentoService.getPreferiti().pipe(
      catchError(err => {
        console.error('Errore caricamento preferiti', err);
        return of([]);
      })
    ).subscribe(prefs => {
      this.preferiti = prefs || [];
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  isPreferito(alimento: AlimentoBaseDto): boolean {
    return this.preferiti.some(p => p.id === alimento.id);
  }

  togglePreferito(alimento: AlimentoBaseDto, event?: Event): void {
    if (event) event.stopPropagation();
    if (!alimento.id) return;

    const idx = this.preferiti.findIndex(p => p.id === alimento.id);
    if (idx >= 0) {
      // Rimuovi referito
      // Optistic UI update
      const backup = [...this.preferiti];
      this.preferiti.splice(idx, 1);
      this.cdr.markForCheck();

      this.alimentoService.removePreferito(alimento.id).pipe(
        catchError(() => {
          this.preferiti = backup; // rollback on error
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          return of(null);
        })
      ).subscribe();
    } else {
      // Aggiungi referito
      // Optistic UI update
      const backup = [...this.preferiti];
      this.preferiti.push({ ...alimento });
      this.cdr.markForCheck();

      this.alimentoService.addPreferito(alimento.id).pipe(
        catchError(() => {
          this.preferiti = backup; // rollback on error
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          return of(null);
        })
      ).subscribe();
    }
  }

  removePreferito(alimento: AlimentoBaseDto): void {
    this.togglePreferito(alimento);
  }

  /* ═══════════════════════════════════════════
     PASTI PERSONALIZZATI (Sezione 3)
  ═══════════════════════════════════════════ */
  private loadPastiTemplates(): void {
    this.loadingPastiTemplates = true;
    this.alimentoService.getPastiTemplates().pipe(
      catchError(err => {
        console.error('Errore caricamento pasti templates', err);
        return of(null);
      })
    ).subscribe(templates => {
      if (templates === null) {
        this.pastiTemplatesBackendAvailable = false;
        this.pastiTemplates = this.loadPastiTemplatesFromLocalStorage();
        this.loadingPastiTemplates = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        return;
      }

      this.pastiTemplatesBackendAvailable = true;
      this.pastiTemplates = (templates || []).slice();
      this.loadingPastiTemplates = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.importLocalPastiTemplatesIfPresent();
    });
  }

  private loadPastiTemplatesFromLocalStorage(): PastoTemplateDto[] {
    let raw: any[] = [];
    try {
      const stored = localStorage.getItem(this.PASTI_KEY);
      raw = stored ? JSON.parse(stored) : [];
    } catch {
      raw = [];
    }

    if (!Array.isArray(raw)) return [];

    return raw.map((t, i) => {
      const idCandidate = Number(t?.id);
      const id = Number.isFinite(idCandidate) && idCandidate > 0 ? idCandidate : Date.now() + i;
      const nome = (t?.nome ?? '').toString();
      const descrizioneRaw = (t?.descrizione ?? '').toString().trim();
      const descrizione = descrizioneRaw ? descrizioneRaw : null;
      const alimentiRaw = Array.isArray(t?.alimenti) ? t.alimenti : [];
      const alimenti = alimentiRaw
        .map((it: any) => ({
          alimento: it?.alimento,
          quantita: Number(it?.quantita ?? 0),
          nomeCustom: (it?.nomeCustom ?? null),
          nomeVisualizzato: (it?.nomeVisualizzato ?? null),
          alternative: Array.isArray(it?.alternative) ? it.alternative : []
        }))
        .filter((it: any) => it.alimento && Number.isFinite(it.quantita) && it.quantita > 0);

      return { id, nome, descrizione, alimenti } as PastoTemplateDto;
    });
  }

  private savePastiTemplatesToLocalStorage(): void {
    localStorage.setItem(this.PASTI_KEY, JSON.stringify(this.pastiTemplates));
  }

  private importLocalPastiTemplatesIfPresent(): void {
    if (!this.pastiTemplatesBackendAvailable) return;
    let localTemplates: any[] = [];
    try {
      const raw = localStorage.getItem(this.PASTI_KEY);
      localTemplates = raw ? JSON.parse(raw) : [];
    } catch {
      localTemplates = [];
    }

    if (!Array.isArray(localTemplates) || localTemplates.length === 0) return;
    if (this.pastiTemplates.length > 0) return;

    const creates = localTemplates.map(t => {
      const nome = (t?.nome ?? '').toString().trim();
      if (!nome) return of(null);
      const descrizioneRaw = (t?.descrizione ?? '').toString().trim();
      const descrizione = descrizioneRaw ? descrizioneRaw : null;
      const alimentiRaw = Array.isArray(t?.alimenti) ? t.alimenti : [];
      const alimenti = alimentiRaw
        .map((it: any) => ({
          alimentoId: Number(it?.alimento?.id),
          quantita: Number(it?.quantita ?? 0),
          nomeCustom: (it?.nomeCustom ?? null),
          alternative: (Array.isArray(it?.alternative) ? it.alternative : [])
            .filter((a: any) => Number(a?.alimentoAlternativo?.id) > 0)
            .map((a: any, idx: number) => ({
              alimentoAlternativoId: Number(a?.alimentoAlternativo?.id),
              quantita: Number(a?.quantita ?? 0) || undefined,
              priorita: Number(a?.priorita ?? 0) > 0 ? Number(a.priorita) : (idx + 1),
              mode: a?.mode,
              manual: a?.manual,
              note: a?.note ?? null,
              nomeCustom: a?.nomeCustom ?? null
            }))
        }))
        .filter((it: any) => Number.isFinite(it.alimentoId) && it.alimentoId > 0 && Number.isFinite(it.quantita) && it.quantita > 0);

      const payload: PastoTemplateUpsertDto = { nome, descrizione, alimenti };
      return this.alimentoService.createPastoTemplate(payload).pipe(
        catchError(() => of(null))
      );
    });

    if (creates.length === 0) return;

    this.loadingPastiTemplates = true;
    this.cdr.detectChanges();

    this.subscriptions.push(
      combineLatest(creates).pipe(
        switchMap(() => this.alimentoService.getPastiTemplates().pipe(catchError(() => of([] as PastoTemplateDto[]))))
      ).subscribe(templates => {
        this.pastiTemplates = (templates || []).slice();
        this.loadingPastiTemplates = false;
        if (this.pastiTemplates.length > 0) {
          localStorage.removeItem(this.PASTI_KEY);
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
    );
  }

  creaPastoTemplate(): void {
    const nome = this.nuovoPastoNome.trim();
    if (!nome) return;
    const descrizioneRaw = this.nuovoPastoDescrizione.trim();

    if (!this.pastiTemplatesBackendAvailable) {
      const created: PastoTemplateDto = {
        id: Date.now(),
        nome,
        descrizione: descrizioneRaw ? descrizioneRaw : null,
        alimenti: []
      };
      this.pastiTemplates.unshift(created);
      this.savePastiTemplatesToLocalStorage();
      this.nuovoPastoNome = '';
      this.nuovoPastoDescrizione = '';
      this.pastoInModifica = created;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    const payload: PastoTemplateUpsertDto = {
      nome,
      descrizione: descrizioneRaw ? descrizioneRaw : null,
      alimenti: []
    };

    this.alimentoService.createPastoTemplate(payload).pipe(
      catchError(err => {
        console.error('Errore creazione template pasto', err);
        return of(null);
      })
    ).subscribe(created => {
      if (!created) return;
      this.pastiTemplates.unshift(created);
      this.nuovoPastoNome = '';
      this.nuovoPastoDescrizione = '';
      this.pastoInModifica = created;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  eliminaPastoTemplate(id: number): void {
    const backup = this.pastiTemplates.slice();
    this.pastiTemplates = this.pastiTemplates.filter(p => p.id !== id);
    if (this.pastoInModifica?.id === id) this.pastoInModifica = null;
    this.cdr.markForCheck();

    if (!this.pastiTemplatesBackendAvailable) {
      this.savePastiTemplatesToLocalStorage();
      this.cdr.detectChanges();
      return;
    }

    this.alimentoService.deletePastoTemplate(id).pipe(
      catchError(err => {
        console.error('Errore eliminazione template pasto', err);
        this.pastiTemplates = backup;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        return of(null);
      })
    ).subscribe(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  editPasto(pasto: PastoTemplateDto): void {
    this.pastoInModifica = pasto;
    this.updateTemplateMacroChart();
  }

  closePastoEdit(): void {
    this.pastoInModifica = null;
    this.catalogoPastiDrawerOpen = false;
    if (this.templateMacroChart) {
      this.templateMacroChart.destroy();
      this.templateMacroChart = undefined;
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  openCatalogoPastiDrawer(): void {
    if (!this.pastoInModifica) return;
    this.catalogoPastiDrawerOpen = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  closeCatalogoPastiDrawer(): void {
    this.catalogoPastiDrawerOpen = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onPastoTemplateAlimentoSelezionato(alimento: AlimentoBaseDto): void {
    if (!this.pastoInModifica) return;
    const exists = this.pastoInModifica.alimenti.some(a => a.alimento.id === alimento.id);
    if (exists) {
      this.setPastoTemplateWarning('Alimento già presente nel template.');
      return;
    }
    this.pastoInModifica.alimenti.push({ alimento: { ...alimento }, quantita: 100, nomeCustom: null, nomeVisualizzato: alimento.nome, alternative: [] });
    this.pastoTemplateSave$.next();
    this.updateTemplateMacroChart();
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  private setPastoTemplateWarning(message: string): void {
    this.pastoTemplateWarning = message;
    if (this.pastoTemplateWarningTimer) clearTimeout(this.pastoTemplateWarningTimer);
    this.pastoTemplateWarningTimer = setTimeout(() => {
      this.pastoTemplateWarning = '';
      this.cdr.detectChanges();
    }, 2500);
    this.cdr.detectChanges();
  }

  removeAlimentoFromPasto(index: number): void {
    if (!this.pastoInModifica) return;
    this.pastoInModifica.alimenti.splice(index, 1);
    this.pastoTemplateSave$.next();
    this.updateTemplateMacroChart();
    this.cdr.markForCheck();
  }

  updateQuantitaPasto(index: number, value: number): void {
    if (!this.pastoInModifica) return;
    this.pastoInModifica.alimenti[index].quantita = Math.max(1, value);
    this.pastoTemplateSave$.next();
    this.updateTemplateMacroChart();
    this.cdr.markForCheck();
  }

  updateNomeCustomPasto(index: number, value: string): void {
    if (!this.pastoInModifica) return;
    const item = this.pastoInModifica.alimenti[index];
    if (!item) return;
    const nome = (value || '').trim();
    const catalogo = (item.alimento?.nome || '').trim();
    item.nomeCustom = (!nome || nome === catalogo) ? null : nome;
    item.nomeVisualizzato = item.nomeCustom || catalogo || null;
    this.pastoTemplateSave$.next();
    this.cdr.markForCheck();
  }

  updateAlternativePasto(index: number, alternatives: PastoTemplateAlternativaDto[]): void {
    if (!this.pastoInModifica) return;
    const item = this.pastoInModifica.alimenti[index];
    if (!item) return;
    item.alternative = alternatives || [];
    this.pastoTemplateSave$.next();
    this.cdr.markForCheck();
  }

  onPastoTemplateMetaChange(): void {
    this.pastoTemplateSave$.next();
    this.cdr.markForCheck();
  }

  private initPastoTemplateAutosave(): void {
    this.subscriptions.push(
      this.pastoTemplateSave$.pipe(
        debounceTime(450),
        switchMap(() => {
          if (!this.pastoInModifica) return of(null);
          if (!this.pastiTemplatesBackendAvailable) {
            this.savePastiTemplatesToLocalStorage();
            return of(null);
          }
          const payload = this.toPastoTemplateUpsertDto(this.pastoInModifica);
          return this.alimentoService.updatePastoTemplate(this.pastoInModifica.id, payload).pipe(
            catchError(err => {
              console.error('Errore salvataggio template pasto', err);
              return of(null);
            })
          );
        })
      ).subscribe(updated => {
        if (!updated) return;
        const idx = this.pastiTemplates.findIndex(p => p.id === updated.id);
        if (idx >= 0) this.pastiTemplates[idx] = updated;
        if (this.pastoInModifica?.id === updated.id) this.pastoInModifica = updated;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
    );
  }

  editingTemplateItemIndex: number | null = null;
  editTemplateNomeValue = '';
  expandedTemplateAlternativeAlimentoIds: Set<number> = new Set();
  pastoTemplateWarning = '';
  private pastoTemplateWarningTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('templatePieChart') templatePieChart?: ElementRef<HTMLCanvasElement>;
  private templateMacroChart?: Chart;
  templateMacroChartHasData = false;
  private templateMacroChartRenderQueued = false;

  startTemplateInlineRename(index: number): void {
    if (!this.pastoInModifica) return;
    const item = this.pastoInModifica.alimenti[index];
    if (!item) return;
    this.editingTemplateItemIndex = index;
    this.editTemplateNomeValue = item.nomeCustom || item.alimento?.nome || '';
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = document.querySelector('.template-inline-nome-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  confirmTemplateInlineRename(): void {
    if (this.editingTemplateItemIndex === null) return;
    const idx = this.editingTemplateItemIndex;
    this.updateNomeCustomPasto(idx, this.editTemplateNomeValue);
    this.editingTemplateItemIndex = null;
    this.editTemplateNomeValue = '';
    this.cdr.detectChanges();
  }

  cancelTemplateInlineRename(): void {
    this.editingTemplateItemIndex = null;
    this.editTemplateNomeValue = '';
    this.cdr.detectChanges();
  }

  onTemplateInlineRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmTemplateInlineRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTemplateInlineRename();
    }
  }

  toggleTemplateAlternativeExpand(alimentoId: number): void {
    if (!Number.isFinite(alimentoId) || alimentoId <= 0) return;
    if (this.expandedTemplateAlternativeAlimentoIds.has(alimentoId)) {
      this.expandedTemplateAlternativeAlimentoIds.delete(alimentoId);
    } else {
      this.expandedTemplateAlternativeAlimentoIds.add(alimentoId);
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  isTemplateAlternativeExpanded(alimentoId: number): boolean {
    return this.expandedTemplateAlternativeAlimentoIds.has(alimentoId);
  }

  getTemplateItemMacro(item: PastoTemplateItemDto, macro: 'proteine' | 'carboidrati' | 'grassi' | 'calorie'): number {
    const alimento = item?.alimento;
    const macros = alimento?.macroNutrienti as any;
    if (!macros) return 0;
    const misura = alimento?.misuraInGrammi || 100;
    const qty = item?.quantita || 0;
    const value = Number(macros?.[macro] || 0);
    return value * qty / misura;
  }

  templateMacroPercentage(macro: 'proteine' | 'carboidrati' | 'grassi'): number {
    if (!this.pastoInModifica) return 0;
    const totals = this.getPastoMacroTotali(this.pastoInModifica);
    const sum = totals.proteine + totals.carboidrati + totals.grassi;
    if (!sum) return 0;
    const val = macro === 'proteine' ? totals.proteine : macro === 'carboidrati' ? totals.carboidrati : totals.grassi;
    return (val / sum) * 100;
  }

  private updateTemplateMacroChart(): void {
    const template = this.pastoInModifica;
    if (!template) return;

    const totals = this.getPastoMacroTotali(template);
    const sum = totals.proteine + totals.carboidrati + totals.grassi;
    this.templateMacroChartHasData = sum > 0;

    if (!this.templateMacroChartHasData) {
      if (this.templateMacroChart) {
        this.templateMacroChart.destroy();
        this.templateMacroChart = undefined;
      }
      this.templateMacroChartRenderQueued = false;
      return;
    }

    const canvas = this.templatePieChart?.nativeElement;
    if (!canvas) {
      if (!this.templateMacroChartRenderQueued) {
        this.templateMacroChartRenderQueued = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.templateMacroChartRenderQueued = false;
          this.updateTemplateMacroChart();
        }, 0);
      }
      return;
    }

    const data = [totals.proteine, totals.carboidrati, totals.grassi];
    const labels = ['Proteine', 'Carboidrati', 'Grassi'];
    const colors = ['#3498db', '#e67e22', '#27ae60'];

    if (this.templateMacroChart) {
      this.templateMacroChart.data.labels = labels;
      this.templateMacroChart.data.datasets[0].data = data as any;
      (this.templateMacroChart.data.datasets[0] as any).borderColor = this.isDarkMode ? '#111827' : '#ffffff';
      (this.templateMacroChart.data.datasets[0] as any).backgroundColor = colors;
      this.templateMacroChart.update();
      return;
    }

    this.templateMacroChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderColor: this.isDarkMode ? '#111827' : '#ffffff',
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: { duration: 450 },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  private toPastoTemplateUpsertDto(template: PastoTemplateDto): PastoTemplateUpsertDto {
    return {
      nome: (template.nome || '').trim(),
      descrizione: template.descrizione ? template.descrizione : null,
      alimenti: (template.alimenti || [])
        .map(it => ({
          alimentoId: Number(it?.alimento?.id),
          quantita: Number(it?.quantita ?? 0),
          nomeCustom: it?.nomeCustom ?? null,
          alternative: (it?.alternative || [])
            .filter(a => a && a.alimentoAlternativo && Number(a.alimentoAlternativo.id) > 0)
            .map((a, idx) => ({
              id: a.id,
              alimentoAlternativoId: Number(a.alimentoAlternativo.id),
              quantita: a.quantita,
              priorita: a.priorita ?? (idx + 1),
              mode: a.mode,
              manual: a.manual,
              note: a.note ?? null,
              nomeCustom: a.nomeCustom ?? null
            }))
        }))
        .filter(it => Number.isFinite(it.alimentoId) && it.alimentoId > 0 && Number.isFinite(it.quantita) && it.quantita > 0)
    };
  }

  getPastoMacroTotali(pasto: PastoTemplateDto): { calorie: number; proteine: number; carboidrati: number; grassi: number } {
    let cal = 0, pro = 0, carb = 0, gra = 0;
    for (const item of pasto.alimenti) {
      const factor = (item.quantita || 100) / (item.alimento.misuraInGrammi || 100);
      const m = item.alimento.macroNutrienti;
      if (m) {
        cal += (m.calorie || 0) * factor;
        pro += (m.proteine || 0) * factor;
        carb += (m.carboidrati || 0) * factor;
        gra += (m.grassi || 0) * factor;
      }
    }
    return { calorie: Math.round(cal), proteine: Math.round(pro * 10) / 10, carboidrati: Math.round(carb * 10) / 10, grassi: Math.round(gra * 10) / 10 };
  }

  /* ═════════════════════════════════════════════
     RICETTE SUGGERITE (Sezione 4)
  ═════════════════════════════════════════════ */
  private loadRicette(): void {
    this.loadingRicette = true;
    this.subscriptions.push(
      this.alimentoService.getRicette().pipe(
        catchError(() => of([] as RicettaDto[]))
      ).subscribe(ricette => {
        this.ricetteSuggerite = ricette;
        this.loadingRicette = false;
        this.cdr.markForCheck();
      })
    );
  }

  importAsTemplate(ricetta: RicettaDto): void {
    if (!ricetta?.id) return;
    this.alimentoService.importRicettaAsTemplate(ricetta.id).pipe(
      catchError(err => {
        console.error('Errore import ricetta come template', err);
        return of(null);
      })
    ).subscribe(template => {
      if (!template) return;
      // Aggiunta ottimistica alla lista dei template
      this.pastiTemplates = [template, ...this.pastiTemplates];
      // Toast di successo per 3s
      if (this.ricettaSuccessTimer) clearTimeout(this.ricettaSuccessTimer);
      this.ricettaImportSuccess = ricetta.id;
      this.ricettaSuccessTimer = setTimeout(() => {
        this.ricettaImportSuccess = null;
        this.cdr.detectChanges();
      }, 3000);
      this.cdr.markForCheck();
    });
  }

  /* ═══════════════════════════════════════════
     AGGIUNGI ALIMENTO (Sezione 5)
  ═══════════════════════════════════════════ */
  private resetNuovoAlimento() {
    this.categoriaCustomMode = false;
    return {
      nome: '', categoria: '',
      calorie: null as number | null, proteine: null as number | null,
      carboidrati: null as number | null, grassi: null as number | null,
      fibre: null as number | null, zuccheri: null as number | null,
      grassiSaturi: null as number | null,
      misuraInGrammi: 100
    };
  }

  categoriaCustomMode = false;

  onCategoriaSelectChange(value: string): void {
    if (value === '__custom__') {
      this.categoriaCustomMode = true;
      this.nuovoAlimento.categoria = '';
    } else {
      this.categoriaCustomMode = false;
      this.nuovoAlimento.categoria = value;
    }
  }

  creaAlimento(): void {
    if (!this.nuovoAlimento.nome.trim()) { this.creazioneErrore = 'Il nome è obbligatorio'; return; }
    this.creatingAlimento = true;
    this.creazioneErrore = '';
    this.creazioneSuccesso = false;

    const macro: any = {
      calorie: this.nuovoAlimento.calorie ?? 0,
      proteine: this.nuovoAlimento.proteine ?? 0,
      carboidrati: this.nuovoAlimento.carboidrati ?? 0,
      grassi: this.nuovoAlimento.grassi ?? 0,
      fibre: this.nuovoAlimento.fibre ?? undefined,
      zuccheri: this.nuovoAlimento.zuccheri ?? undefined,
      grassiSaturi: this.nuovoAlimento.grassiSaturi ?? undefined
    };

    this.alimentoService.createPersonale({
      nome: this.nuovoAlimento.nome.trim(),
      categoria: this.nuovoAlimento.categoria.trim() || undefined,
      macroNutrienti: macro,
      misuraInGrammi: this.nuovoAlimento.misuraInGrammi || 100
    }).pipe(
      catchError(err => {
        this.creazioneErrore = err?.error?.message || 'Errore durante la creazione';
        return of(null);
      })
    ).subscribe(result => {
      this.creatingAlimento = false;
      if (result) {
        const created: AlimentoBaseDto = {
          ...result,
          personale: (result as any)?.personale ?? true
        };

        if (created.id) {
          const idx = this.allAlimentiCache.findIndex(a => a.id === created.id);
          if (idx >= 0) {
            this.allAlimentiCache[idx] = created;
          } else {
            this.allAlimentiCache = [created, ...this.allAlimentiCache];
          }
          this.allAlimentiLoaded = true;
          this.filterChanged$.next();
        }

        if (created.categoria && !this.categorieGlobali.includes(created.categoria)) {
          this.categorieGlobali = [...this.categorieGlobali, created.categoria].sort((a, b) => a.localeCompare(b));
        }

        this.creazioneSuccesso = true;
        this.nuovoAlimento = this.resetNuovoAlimento();
        setTimeout(() => { this.creazioneSuccesso = false; this.cdr.markForCheck(); this.cdr.detectChanges(); }, 3000);
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  /** Elimina un alimento personale */
  eliminaAlimento(alimento: AlimentoBaseDto, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Eliminare "${alimento.nome}"? Questa azione non è reversibile.`)) {
      return;
    }
    if (!alimento.id) return;
    this.alimentoService.deletePersonale(alimento.id).pipe(
      catchError(err => {
        console.error('Errore eliminazione:', err);
        return EMPTY;
      })
    ).subscribe(() => {
      const id = alimento.id!;
      const hadInSearchResultsAll = this.searchResultsAll.some(a => a.id === id);
      this.allAlimentiCache = this.allAlimentiCache.filter(a => a.id !== alimento.id);
      this.preferiti = this.preferiti.filter(p => p.id !== alimento.id);
      this.alimentiDisponibili = this.alimentiDisponibili.filter(a => a.id !== alimento.id);
      this.searchResultsAll = this.searchResultsAll.filter(a => a.id !== alimento.id);

      if ((this.hasActiveFilters || this.searchQuery?.trim()) && hadInSearchResultsAll) {
        this.totalElements = Math.max(0, this.totalElements - 1);
        this.totalPages = Math.max(1, Math.ceil(this.totalElements / this.pageSize));
        this.currentPage = Math.max(0, Math.min(this.currentPage, this.totalPages - 1));
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // Ricarica categorie
      this.alimentoService.getCategorie().subscribe(cats => {
        this.categorieGlobali = cats || [];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    });
  }

  /* ═══════════════════════════════════════════
  /* ═══════════════════════════════════════════
     PIÙ UTILIZZATI (Sezione 6)
  ═══════════════════════════════════════════ */
  private loadTopAlimenti(): void {
    this.alimentoService.getTopAlimenti(10).pipe(
      catchError(() => of([]))
    ).subscribe((top: AlimentoBaseDto[]) => {
      this.topAlimenti = top || [];
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  /** Call this from other components when an alimento is used */
  trackAlimentoUsage(alimento: AlimentoBaseDto): void {
    // Ora è tracciato dal backend tramite le associazioni reali AlimentoPasto
  }

  /* ═══════════════════════════════════════════
     CONFRONTO ALIMENTI (Sezione 7)
  ═══════════════════════════════════════════ */
  searchConfronto(query: string): void {
    this.confrontoSearch = query;
    if (query.trim().length < 2) { this.confrontoResults = []; return; }
    this.confrontoLoading = true;
    this.alimentoService.search(query).pipe(
      catchError(() => of([] as AlimentoBaseDto[]))
    ).subscribe(results => {
      this.confrontoResults = results.filter(
        r => !this.confrontoSelezionati.some(s => s.id === r.id)
      ).slice(0, 6);
      this.confrontoLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  addToConfronto(alimento: AlimentoBaseDto): void {
    if (this.confrontoSelezionati.length >= 4) return;
    if (this.confrontoSelezionati.some(s => s.id === alimento.id)) return;
    this.confrontoSelezionati.push(alimento);
    this.confrontoSearch = '';
    this.confrontoResults = [];
  }

  removeFromConfronto(index: number): void {
    this.confrontoSelezionati.splice(index, 1);
  }

  clearConfronto(): void {
    this.confrontoSelezionati = [];
    this.confrontoSearch = '';
    this.confrontoResults = [];
  }

  get confrontoRows(): { label: string; key: string; unit: string }[] {
    return [
      { label: 'Calorie', key: 'calorie', unit: 'kcal' },
      { label: 'Proteine', key: 'proteine', unit: 'g' },
      { label: 'Carboidrati', key: 'carboidrati', unit: 'g' },
      { label: 'Grassi', key: 'grassi', unit: 'g' },
      { label: 'Fibre', key: 'fibre', unit: 'g' },
      { label: 'Zuccheri', key: 'zuccheri', unit: 'g' },
      { label: 'Grassi Saturi', key: 'grassiSaturi', unit: 'g' }
    ];
  }

  getMacroValue(alimento: AlimentoBaseDto, key: string): string {
    const m = alimento.macroNutrienti as any;
    if (!m) return 'N.D.';
    const val = m[key];
    return val != null && Number.isFinite(val) ? val.toFixed(1) : 'N.D.';
  }

  getMaxForKey(key: string): number {
    let max = 0;
    for (const a of this.confrontoSelezionati) {
      const v = (a.macroNutrienti as any)?.[key];
      if (v != null && Number.isFinite(v) && v > max) max = v;
    }
    return max;
  }

  isMaxForKey(alimento: AlimentoBaseDto, key: string): boolean {
    const v = (alimento.macroNutrienti as any)?.[key];
    return v != null && Number.isFinite(v) && v > 0 && v === this.getMaxForKey(key);
  }

  /* ═══════════════════════════════════════════
     STATISTICHE (Sezione 8)
  ═══════════════════════════════════════════ */
  private loadStatistiche(): void {
    this.loadingStats = true;
    // Load a large batch to compute stats
    this.alimentoService.getAll(0, 200).pipe(
      catchError(() => of({ contenuto: [], totalePagine: 0, numeroPagina: 0, totaleElementi: 0 }))
    ).subscribe(resp => {
      const items = resp.contenuto || [];
      this.statTotaleAlimenti = resp.totaleElementi || items.length;

      // Categories
      const catMap = new Map<string, number>();
      let sumCal = 0, sumP = 0, sumC = 0, sumG = 0;
      for (const a of items) {
        const cat = a.categoria || 'Senza categoria';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
        const m = a.macroNutrienti;
        if (m) {
          sumCal += m.calorie || 0;
          sumP += m.proteine || 0;
          sumC += m.carboidrati || 0;
          sumG += m.grassi || 0;
        }
      }
      const total = items.length || 1;
      this.statMacroMedi = {
        calorie: Math.round(sumCal / total),
        proteine: Math.round(sumP / total * 10) / 10,
        carboidrati: Math.round(sumC / total * 10) / 10,
        grassi: Math.round(sumG / total * 10) / 10
      };

      this.statCategorie = Array.from(catMap.entries())
        .map(([categoria, count]) => ({ categoria, count, pct: Math.round(count / total * 100) }))
        .sort((a, b) => b.count - a.count);

      // Top proteine & fibre
      this.statTopProteine = [...items]
        .filter(a => a.macroNutrienti?.proteine != null)
        .sort((a, b) => (b.macroNutrienti?.proteine || 0) - (a.macroNutrienti?.proteine || 0))
        .slice(0, 5);

      this.statTopFibre = [...items]
        .filter(a => a.macroNutrienti?.fibre != null && (a.macroNutrienti?.fibre || 0) > 0)
        .sort((a, b) => (b.macroNutrienti?.fibre || 0) - (a.macroNutrienti?.fibre || 0))
        .slice(0, 5);

      this.loadingStats = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }
}
