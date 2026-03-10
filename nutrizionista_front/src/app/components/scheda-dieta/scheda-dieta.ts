import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, inject, ChangeDetectorRef, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, finalize, timeout } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBook, faFloppyDisk, faUtensils, faSun, faMoon, faMugHot,
  faAppleWhole, faTrash, faChevronRight, faChevronDown,
  faChartPie, faDumbbell, faWheatAlt, faDroplet, faFire,
  faPlus, faEdit, faXmark, faToggleOn, faToggleOff, faCalendarDays,
  faMagnifyingGlass, faCopy, faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto, PastoFormDto, GiornoSettimana } from '../../dto/pasto.dto';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoPastoDto, AlimentoPastoRequest } from '../../dto/alimento-pasto.dto';

import { SchedaService } from '../../services/scheda-service';
import { SchedaCacheService } from '../../services/scheda-cache.service';
import { PastoService } from '../../services/pasto-service';
import { MealService } from '../../services/meal.service';
import { AlimentoPastoService } from '../../services/alimento-pasto-service';
import { AlimentoPastoDisplayNameService } from '../../services/alimento-pasto-display-name.service';
import { AlimentoService } from '../../services/alimento-service';
import { AlimentoAlternativoService } from '../../services/alimento-alternativo.service';
import { AlimentoDaEvitareService } from '../../services/alimento-da-evitare-service';
import { AlimentoAlternativoDto, AlimentoAlternativoUpsertDto, AlternativeModeDto } from '../../dto/alimento-alternativo.dto';
import { AlimentoDaEvitareDto } from '../../dto/alimento-da-evitare.dto';
import { CatalogoAlimenti } from '../catalogo-alimenti/catalogo-alimenti';
import { CalcoloMacro } from '../calcolo-macro/calcolo-macro';
import { ListaAlternative } from '../lista-alternative/lista-alternative';
import { ModalAlimento } from '../modal-alimento/modal-alimento';
import { ObiettivoNutrizionale } from '../obiettivo-nutrizionale/obiettivo-nutrizionale';
import { ModalDatiMancanti } from '../modal-dati-mancanti/modal-dati-mancanti';
import { Chart } from 'chart.js/auto';
import { ThemeService } from '../../services/theme.service';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';
type AlternativeMode = MacroType;

type AlternativeProposal = {
  alimento: AlimentoBaseDto;
  quantita: number;
  mode: AlternativeMode;
  manual: boolean;
  savedId?: number; // ID from backend for persistence
  saving?: boolean;
  nomeCustom?: string | null;
  nomeVisualizzato?: string | null;
};

type AlternativeEntry = { index: number; alt: AlternativeProposal };

@Component({
  selector: 'app-scheda-dieta',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, CatalogoAlimenti, CalcoloMacro, ListaAlternative, ModalAlimento, ObiettivoNutrizionale, ModalDatiMancanti],
  templateUrl: './scheda-dieta.html',
  styleUrls: ['./scheda-dieta.css']
})
export class SchedaDietaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() clienteId!: number;
  @Input() schedaId?: number;
  @Input() schedaNome?: string;
  @Input() isDarkMode = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private schedaService = inject(SchedaService);
  private schedaCache = inject(SchedaCacheService);
  private alimentoPastoService = inject(AlimentoPastoService);
  private pastoService = inject(PastoService);
  private mealService = inject(MealService);
  private alimentoPastoDisplayNameService = inject(AlimentoPastoDisplayNameService);
  private alimentoService = inject(AlimentoService);
  private alternativoService = inject(AlimentoAlternativoService);
  private alimentoDaEvitareService = inject(AlimentoDaEvitareService);
  private themeService = inject(ThemeService);

  loading = false;
  saving = false;
  loadingAlimenti = false;
  errorMessage = '';
  successMessage = '';

  scheda?: SchedaDto;
  pasti: PastoDto[] = [];
  pastoEspansoKey?: string;
  pastoEspansoLabel?: string;
  autoSaving = false;

  // === WEEKLY PLAN ===
  readonly giorni: { key: GiornoSettimana; label: string; short: string }[] = [
    { key: 'LUNEDI', label: 'Lunedì', short: 'Lun' },
    { key: 'MARTEDI', label: 'Martedì', short: 'Mar' },
    { key: 'MERCOLEDI', label: 'Mercoledì', short: 'Mer' },
    { key: 'GIOVEDI', label: 'Giovedì', short: 'Gio' },
    { key: 'VENERDI', label: 'Venerdì', short: 'Ven' },
    { key: 'SABATO', label: 'Sabato', short: 'Sab' },
    { key: 'DOMENICA', label: 'Domenica', short: 'Dom' }
  ];
  selectedGiorno: GiornoSettimana = 'LUNEDI';

  get isSettimanale(): boolean {
    return this.scheda?.tipo === 'SETTIMANALE';
  }

  get filteredPasti(): PastoDto[] {
    if (!this.isSettimanale) return this.pasti;
    return this.pasti.filter(p => p.giorno === this.selectedGiorno);
  }

  selectGiorno(giorno: GiornoSettimana): void {
    if (this.selectedGiorno === giorno) return;
    this.selectedGiorno = giorno;

    // Riavvia l'animazione attivando la classe per 300ms
    this.dayAnimating = false;
    this.cdr.detectChanges(); // forza rimozione
    setTimeout(() => {
      this.dayAnimating = true;
      this.cdr.detectChanges();
    }, 10);
  }

  dayAnimating = false;

  getGiornoLabel(key: string): string {
    const found = this.giorni.find(g => g.key === key);
    return found ? found.label : key;
  }

  // --- COPY DAY LOGIC ---
  openCopyDayModal(): void {
    this.showCopyDayModal = true;
    this.copyDayTargetDays = {};
    for (const g of this.giorni) {
      if (g.key !== this.selectedGiorno) {
        this.copyDayTargetDays[g.key] = false; // Initialize to false
      }
    }

    // Inizializza la selezione alimenti
    this.copyDaySelectedAlimenti = {};
    for (const pasto of this.filteredPasti) {
      if (pasto.alimentiPasto) {
        for (const ap of pasto.alimentiPasto) {
          if (ap.id) {
            this.copyDaySelectedAlimenti[ap.id] = true; // Preselezionati tutti
          }
        }
      }
    }
  }

  closeCopyDayModal(): void {
    this.showCopyDayModal = false;
  }

  hasSelectedTargetDays(): boolean {
    return Object.values(this.copyDayTargetDays).some(val => val);
  }

  // Helper Methods for UI Checkboxes
  isPastoFullySelected(pasto: PastoDto): boolean {
    if (!pasto.alimentiPasto || pasto.alimentiPasto.length === 0) return false;
    return pasto.alimentiPasto.every(ap => ap.id && this.copyDaySelectedAlimenti[ap.id]);
  }

  isPastoPartiallySelected(pasto: PastoDto): boolean {
    if (!pasto.alimentiPasto || pasto.alimentiPasto.length === 0) return false;
    const selectedCount = pasto.alimentiPasto.filter(ap => ap.id && this.copyDaySelectedAlimenti[ap.id]).length;
    return selectedCount > 0 && selectedCount < pasto.alimentiPasto.length;
  }

  togglePastoSelection(pasto: PastoDto, event: any): void {
    const isChecked = event.target.checked;
    if (pasto.alimentiPasto) {
      for (const ap of pasto.alimentiPasto) {
        if (ap.id) {
          this.copyDaySelectedAlimenti[ap.id] = isChecked;
        }
      }
    }
  }

  eseguiCopiaGiorno(): void {
    if (!this.schedaId) return;

    const targetDays = Object.keys(this.copyDayTargetDays).filter(k => this.copyDayTargetDays[k]);
    if (targetDays.length === 0) return;

    // Raccogli solo gli ID degli alimenti spuntati
    const selectedAlimentoIds = Object.keys(this.copyDaySelectedAlimenti)
      .filter(idStr => this.copyDaySelectedAlimenti[Number(idStr)])
      .map(idStr => Number(idStr));

    this.copyDaySaving = true;
    this.schedaService.copyDay(this.schedaId, this.selectedGiorno, targetDays, selectedAlimentoIds).subscribe({
      next: (schedaAggiornata) => {
        this.copyDaySaving = false;
        this.closeCopyDayModal();
        this.successMessage = 'Giorno copiato con successo!';
        // Ricarica la scheda per avere i dati aggiornati
        this.schedaCache.invalidate(this.schedaId!);
        this.loadScheda();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Errore copia giorno:', err);
        this.copyDaySaving = false;
        this.errorMessage = 'Errore durante la copia del giorno.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  showCreateMeal = false;
  createMealNome = '';
  createMealDescrizione = '';
  modalAlimentoOpen = false;
  modalAlimentoLoading = false;
  modalAlimento?: AlimentoBaseDto;
  modalQuantita = 100;

  editingNomeScheda = false;
  editNomeSchedaOriginale = '';
  editNomeScheda = '';
  editNomeSchedaError = '';
  savingNomeScheda = false;

  // -- COPY DAY MODAL STATE --
  showCopyDayModal = false;
  copyDayTargetDays: Record<string, boolean> = {};
  copyDaySelectedAlimenti: Record<number, boolean> = {};
  copyDaySaving = false;

  // Obiettivo - missing data modal
  modalDatiMancanti = false;
  campiMancanti: string[] = [];
  alimentiDaEvitare: AlimentoDaEvitareDto[] = [];

  // Catalogo drawer
  catalogoDrawerOpen = false;
  editingAlimentoPastoId: number | null = null;
  editNomeValue = '';

  @ViewChild('macroPieChart') macroPieChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('mealDonutChart') mealDonutChart?: ElementRef<HTMLCanvasElement>;
  macroChart?: Chart;
  macroChartHasData = false;
  private macroChartRenderQueued = false;
  mealChart?: Chart;
  mealChartHasData = false;
  mealBreakdown: { label: string; kcal: number; pct: number; color: string; index: number }[] = [];

  protected readonly icons = {
    book: faBook, save: faFloppyDisk, utensils: faUtensils, sun: faSun, moon: faMoon,
    coffee: faMugHot, apple: faAppleWhole, trash: faTrash, chevronRight: faChevronRight,
    chevronDown: faChevronDown, chart: faChartPie, dumbbell: faDumbbell,
    wheat: faWheatAlt, droplet: faDroplet, fire: faFire,
    plus: faPlus, edit: faEdit, close: faXmark,
    toggleOn: faToggleOn, toggleOff: faToggleOff, calendar: faCalendarDays,
    search: faMagnifyingGlass, copy: faCopy, spinner: faSpinner
  };

  defaultAlternativeMode: AlternativeMode = 'calorie';
  alternativeByAlimentoPastoId: Record<number, (AlternativeProposal | null)[]> = {};
  alternativeByPastoId: Record<number, (AlternativeProposal | null)[]> = {};
  alternativeUi: Record<string, { editing: boolean; query: string; loading: boolean; results: AlimentoBaseDto[] }> = {};
  private alternativeSearchTimers: Record<string, number> = {};
  expandedAlternativeAlimentoIds: Set<number> = new Set();

  // === DEBOUNCE SYSTEM ===
  hasPendingChanges = false;
  private pendingAlimentoUpdates = new Map<string, AlimentoPastoRequest>();
  private pendingAlternativeUpdates = new Map<number, { alimentoPastoId: number; alternativeId: number; body: AlimentoAlternativoUpsertDto }>();
  private alimentoPastoIdByKey = new Map<string, number>();
  private alimentoQuantitaSubject = new Subject<AlimentoPastoRequest>();
  private alternativeQuantitaSubject = new Subject<{ alimentoPastoId: number; alternativeId: number; body: AlimentoAlternativoUpsertDto }>();
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    const routeClienteId = this.route.snapshot.paramMap.get('clienteId');
    if (routeClienteId && !this.clienteId) {
      this.clienteId = Number(routeClienteId);
    }
    // rimosso il loadScheda da qui perché ngOnChanges viene scatenato PRIMA di ngOnInit in Angular, 
    // e chiamandolo anche qui si generavano 2 richieste HTTP sovrapposte per caricare la scheda
    // e le sue alternative ad ogni singolo avvio.

    // Load alimenti da evitare per il cliente (Features 6, 10)
    if (this.clienteId) {
      this.alimentoDaEvitareService.getAllByCliente(this.clienteId, 0, 100).subscribe({
        next: (resp) => {
          this.alimentiDaEvitare = resp.contenuto || [];
          this.cdr.detectChanges();
        },
        error: () => { /* silently ignore */ }
      });
    }

    // Setup debounce for alimento quantity updates
    this.subscriptions.push(
      this.alimentoQuantitaSubject.pipe(
        debounceTime(500),
        tap(() => this.hasPendingChanges = true),
        switchMap(req => this.alimentoPastoService.updateQuantita(req).pipe(
          tap(() => {
            const key = `${req.pasto.id}_${req.alimento.id}`;
            this.pendingAlimentoUpdates.delete(key);
            this.updatePendingState();
          }),
          catchError(err => {
            console.error('Errore aggiornamento quantità alimento:', err);
            return EMPTY;
          })
        ))
      ).subscribe()
    );

    // Setup debounce for alternative quantity updates
    this.subscriptions.push(
      this.alternativeQuantitaSubject.pipe(
        debounceTime(500),
        tap(() => this.hasPendingChanges = true),
        switchMap(update => this.alternativoService.updateNested(update.alimentoPastoId, update.alternativeId, update.body).pipe(
          timeout(8000),
          tap(() => {
            this.pendingAlternativeUpdates.delete(update.alternativeId);
            this.setAlternativeSavingBySavedId(update.alimentoPastoId, update.alternativeId, false);
            this.updatePendingState();
          }),
          catchError(err => {
            console.error('Errore aggiornamento quantità alternativa:', err);
            this.setAlternativeSavingBySavedId(update.alimentoPastoId, update.alternativeId, false);
            this.showAlternativeHttpError(err, 'Errore aggiornamento quantità alternativa');
            return EMPTY;
          })
        ))
      ).subscribe()
    );

    this.subscriptions.push(
      this.themeService.isDarkMode$.subscribe(isDark => {
        this.isDarkMode = isDark;
        this.updateMacroChartFromPasti();
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateMacroChartFromPasti(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedaId']) {
      if (this.schedaId) {
        this.loadScheda();
      } else {
        this.scheda = undefined;
        this.pasti = [];
        this.initializePastiVuoti();
        this.loading = false;
      }
    }

    if (changes['isDarkMode'] && !changes['isDarkMode'].firstChange) {
      this.updateMacroChartFromPasti();
    }
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Cleanup timers
    Object.values(this.alternativeSearchTimers).forEach(t => clearTimeout(t));
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasPendingChanges) {
      this.flushPendingChanges();
      event.preventDefault();
      event.returnValue = 'Hai modifiche non salvate. Sei sicuro di voler uscire?';
    }
  }

  private updatePendingState(): void {
    this.hasPendingChanges = this.pendingAlimentoUpdates.size > 0 || this.pendingAlternativeUpdates.size > 0;
    this.cdr.detectChanges();
  }

  private flushPendingChanges(): void {
    // Flush all pending alimento updates immediately
    this.pendingAlimentoUpdates.forEach(req => {
      this.alimentoPastoService.updateQuantita(req).subscribe();
    });
    this.pendingAlimentoUpdates.clear();

    // Flush all pending alternative updates immediately
    this.pendingAlternativeUpdates.forEach(update => {
      this.alternativoService.updateNested(update.alimentoPastoId, update.alternativeId, update.body).subscribe();
    });
    this.pendingAlternativeUpdates.clear();

    this.hasPendingChanges = false;
  }

  // --- CARICAMENTO DATI ---

  loadScheda(): void {
    if (!this.schedaId) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.schedaService.getById(this.schedaId).subscribe({
      next: (scheda) => {
        this.scheda = scheda;
        this.schedaNome = scheda.nome;
        // Merge: sempre 4 pasti di default + dati dal server
        this.mergePastiConDefault(scheda.pasti || []);
        this.syncAlternativeState();

        // Single batch call for alternatives after the scheda is loaded
        if (this.scheda?.id) {
          this.loadAllAlternativesForScheda(this.scheda.id);
        }

        this.updateMacroChartFromPasti();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento della scheda';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Merge i pasti dal backend con i 4 pasti di default.
   * Questo assicura che tutti e 4 i pasti siano sempre visibili.
   * Per schede SETTIMANALI, i pasti vengono usati direttamente dal server
   * (il backend crea già 28 pasti: 4 per ciascuno dei 7 giorni).
   */
  private mergePastiConDefault(pastiDalServer: PastoDto[]): void {
    // Per schede settimanali: il backend ha già creato i pasti per ogni giorno,
    // non dobbiamo fare alcun merge per evitare di sovrascrivere i dati
    if (this.isSettimanale) {
      this.pasti = pastiDalServer.sort((a, b) => {
        const ao = a.ordineVisualizzazione ?? 999;
        const bo = b.ordineVisualizzazione ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.nome ?? '').localeCompare(b.nome ?? '');
      });
      this.syncAlternativeState();
      this.updateMacroChartFromPasti();
      return;
    }

    // Per schede giornaliere: merge con i 4 pasti di default
    const defaultNames = ['Colazione', 'Pranzo', 'Merenda', 'Cena'];
    const isDefaultByNameOrCode = (p: PastoDto) => {
      const code = (p.defaultCode ?? '').toLowerCase();
      const nome = (p.nome ?? '').toLowerCase();
      return defaultNames.some(d => d.toLowerCase() === code || d.toLowerCase() === nome);
    };

    const defaults: PastoDto[] = defaultNames.map((nome) => {
      const pastoDalServer = pastiDalServer.find(p => (p.defaultCode ?? p.nome)?.toLowerCase() === nome.toLowerCase());
      if (pastoDalServer) return pastoDalServer;

      return {
        id: -1,
        nome,
        defaultCode: nome,
        descrizione: null,
        ordineVisualizzazione: this.getDefaultMealOrder(nome),
        eliminabile: false,
        alimentiPasto: [],
        orarioInizio: this.getDefaultOrario(nome, 'inizio'),
        orarioFine: this.getDefaultOrario(nome, 'fine')
      };
    });

    const customMeals = pastiDalServer
      .filter(p => !isDefaultByNameOrCode(p))
      .sort((a, b) => {
        const ao = a.ordineVisualizzazione ?? 999;
        const bo = b.ordineVisualizzazione ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.nome ?? '').localeCompare(b.nome ?? '');
      });

    this.pasti = [...defaults, ...customMeals];
    this.syncAlternativeState();
    this.updateMacroChartFromPasti();
  }

  private initializePastiVuoti(): void {
    const mealTypes = ['Colazione', 'Pranzo', 'Merenda', 'Cena'] as const;
    this.pasti = mealTypes.map((nome) => ({
      id: -1,
      nome,
      defaultCode: nome,
      descrizione: null,
      ordineVisualizzazione: this.getDefaultMealOrder(nome),
      eliminabile: false,
      alimentiPasto: [],
      orarioInizio: this.getDefaultOrario(nome, 'inizio'),
      orarioFine: this.getDefaultOrario(nome, 'fine')
    }));
    this.syncAlternativeState();
    this.updateMacroChartFromPasti();
  }

  private getDefaultOrario(pasto: string, tipo: 'inizio' | 'fine'): string {
    const orari: Record<string, { inizio: string; fine: string }> = {
      'Colazione': { inizio: '07:00', fine: '08:00' },
      'Pranzo': { inizio: '12:30', fine: '13:30' },
      'Merenda': { inizio: '16:00', fine: '16:30' },
      'Cena': { inizio: '19:30', fine: '20:30' }
    };
    return orari[pasto] ? orari[pasto][tipo] : '';
  }

  private getDefaultMealOrder(nome: string): number {
    if (nome === 'Colazione') return 1;
    if (nome === 'Pranzo') return 2;
    if (nome === 'Merenda') return 3;
    if (nome === 'Cena') return 4;
    return 999;
  }

  startRenameSchedaTitle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.savingNomeScheda) return;
    if (!this.scheda?.id) return;

    this.editingNomeScheda = true;
    this.editNomeSchedaOriginale = this.scheda.nome ?? '';
    this.editNomeScheda = this.editNomeSchedaOriginale;
    this.editNomeSchedaError = '';
    this.cdr.detectChanges();

    setTimeout(() => {
      const input = document.getElementById(`scheda-dieta-title-input-${this.scheda?.id}`) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 0);
  }

  cancelRenameSchedaTitle(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.savingNomeScheda) return;
    this.editingNomeScheda = false;
    this.editNomeScheda = '';
    this.editNomeSchedaOriginale = '';
    this.editNomeSchedaError = '';
    this.cdr.detectChanges();
  }

  confirmRenameSchedaTitle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.savingNomeScheda) return;
    if (!this.scheda?.id) return;

    const schedaId = this.scheda.id;
    const trimmed = (this.editNomeScheda ?? '').trim();
    const validation = this.validateSchedaNome(trimmed);
    if (validation) {
      this.editNomeSchedaError = validation;
      this.cdr.detectChanges();
      const input = document.getElementById(`scheda-dieta-title-input-${schedaId}`) as HTMLInputElement | null;
      input?.focus();
      input?.select();
      return;
    }

    if (trimmed === (this.editNomeSchedaOriginale ?? '').trim()) {
      this.cancelRenameSchedaTitle(event);
      return;
    }

    this.savingNomeScheda = true;
    this.editNomeSchedaError = '';
    this.cdr.detectChanges();

    const clienteId = this.scheda.cliente?.id ?? this.clienteId;
    this.schedaService.update({
      id: schedaId,
      nome: trimmed,
      cliente: { id: clienteId },
      attiva: this.scheda.attiva,
      dataCreazione: this.scheda.dataCreazione
    } as any).subscribe({
      next: (updated) => {
        this.savingNomeScheda = false;
        this.editingNomeScheda = false;
        this.scheda = { ...(this.scheda as SchedaDto), ...updated, nome: updated.nome ?? trimmed } as any;
        this.schedaCache.invalidate(schedaId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingNomeScheda = false;
        this.editNomeSchedaError = err?.error?.message || 'Impossibile salvare il nome';
        this.cdr.detectChanges();
        const input = document.getElementById(`scheda-dieta-title-input-${schedaId}`) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
    });
  }

  private validateSchedaNome(value: string): string {
    if (!value) return 'Il nome non può essere vuoto';
    if (value.length < 3) return 'Minimo 3 caratteri';
    if (value.length > 50) return 'Massimo 50 caratteri';
    return '';
  }

  toggleAttiva(): void {
    if (!this.scheda?.id) return;
    const wasActive = this.scheda.attiva;

    if (!wasActive) {
      // Activate (backend will deactivate others)
      this.schedaService.activate(this.scheda.id).subscribe({
        next: (updated) => {
          if (this.scheda) this.scheda.attiva = true;
          this.successMessage = 'Scheda attivata';
          this.cdr.detectChanges();
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 2500);
        },
        error: () => {
          this.errorMessage = 'Errore nell\'attivazione';
          this.cdr.detectChanges();
          setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
        }
      });
    } else {
      // Deactivate via update
      this.schedaService.update({
        id: this.scheda.id,
        nome: this.scheda.nome,
        cliente: { id: this.clienteId },
        attiva: false
      }).subscribe({
        next: () => {
          if (this.scheda) this.scheda.attiva = false;
          this.successMessage = 'Scheda archiviata';
          this.cdr.detectChanges();
          setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 2500);
        },
        error: () => {
          this.errorMessage = 'Errore nella disattivazione';
          this.cdr.detectChanges();
          setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
        }
      });
    }
  }

  pastoKey(pasto: PastoDto): string {
    return pasto.id && pasto.id > 0 ? String(pasto.id) : pasto.nome;
  }

  /** Feature 13: Drag & Drop meal reorder */
  dragIndex: number | null = null;
  dropIndex: number | null = null;

  onDragStart(index: number): void {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dropIndex = index;
  }

  onDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.dragIndex !== null && this.dragIndex !== index) {
      const moved = this.pasti.splice(this.dragIndex, 1)[0];
      this.pasti.splice(index, 0, moved);
      this.cdr.detectChanges();
    }
    this.dragIndex = null;
    this.dropIndex = null;
  }

  onDragEnd(): void {
    this.dragIndex = null;
    this.dropIndex = null;
  }

  openCatalogoDrawer(): void {
    if (!this.pastoEspansoKey) return; // serve un pasto espanso
    this.catalogoDrawerOpen = true;
  }

  closeCatalogoDrawer(): void {
    this.catalogoDrawerOpen = false;
  }

  // Inline rename for compact table
  startInlineRename(ap: AlimentoPastoDto): void {
    this.editingAlimentoPastoId = ap.id;
    this.editNomeValue = ap.nomeCustom || ap.alimento?.nome || '';
    this.cdr.detectChanges();
    // Focus the input after render
    setTimeout(() => {
      const input = document.querySelector('.inline-nome-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  confirmInlineRename(): void {
    if (this.editingAlimentoPastoId === null) return;
    const nome = this.editNomeValue.trim();
    const ap = this.pasti.flatMap(p => p.alimentiPasto || []).find(a => a.id === this.editingAlimentoPastoId);
    const catalogo = (ap?.alimento?.nome || '').trim();
    const finalNome = (!nome || nome === catalogo) ? null : nome;

    this.onDisplayNameChange({ alimentoPastoId: this.editingAlimentoPastoId, nome: finalNome });
    this.editingAlimentoPastoId = null;
    this.editNomeValue = '';
  }

  cancelInlineRename(): void {
    this.editingAlimentoPastoId = null;
    this.editNomeValue = '';
    this.cdr.detectChanges();
  }

  onInlineRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmInlineRename();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelInlineRename();
    }
  }

  private getPastoByKey(key: string): PastoDto | undefined {
    const id = Number(key);
    if (!Number.isNaN(id) && id > 0) {
      return this.pasti.find(p => p.id === id);
    }
    return this.pasti.find(p => p.nome === key);
  }

  // --- UI HELPERS ---
  togglePasto(pasto: PastoDto): void {
    const key = this.pastoKey(pasto);
    if (this.pastoEspansoKey === key) {
      this.pastoEspansoKey = undefined;
      this.pastoEspansoLabel = undefined;
      return;
    }
    this.pastoEspansoKey = key;
    this.pastoEspansoLabel = pasto.nome;
  }



  getIconaPasto(nome?: string): IconDefinition {
    switch (nome) {
      case 'Colazione': return this.icons.coffee;
      case 'Pranzo': return this.icons.sun;
      case 'Cena': return this.icons.moon;
      case 'Merenda': return this.icons.apple;
      default: return this.icons.utensils;
    }
  }

  openCreateMeal(): void {
    this.showCreateMeal = true;
    this.createMealNome = '';
    this.createMealDescrizione = '';
    this.cdr.detectChanges();
  }

  cancelCreateMeal(): void {
    this.showCreateMeal = false;
    this.createMealNome = '';
    this.createMealDescrizione = '';
    this.cdr.detectChanges();
  }

  submitCreateMeal(): void {
    if (!this.schedaId) {
      this.showError('Errore: schedaId mancante.');
      return;
    }
    const nome = this.createMealNome.trim();
    if (!nome) {
      this.showError('Inserisci un nome per il pasto.');
      return;
    }

    const maxOrder = this.pasti.reduce((max, p) => Math.max(max, p.ordineVisualizzazione ?? 0), 0);
    this.mealService.create({
      schedaId: this.schedaId,
      nome,
      descrizione: this.createMealDescrizione.trim() || undefined,
      ordineVisualizzazione: maxOrder + 1,
      giorno: this.isSettimanale ? this.selectedGiorno : undefined
    }).subscribe({
      next: (created) => {
        this.pasti = [...this.pasti, { ...created, alimentiPasto: created.alimentiPasto ?? [] }]
          .sort((a, b) => (a.ordineVisualizzazione ?? 999) - (b.ordineVisualizzazione ?? 999));
        this.cancelCreateMeal();
        this.updateMacroChartFromPasti();
        this.showSuccess('Pasto aggiunto.');
      },
      error: (err) => {
        console.error('Errore creazione pasto custom:', err);
        this.showError('Errore nella creazione del pasto.');
      }
    });
  }

  onRinominaPasto(pasto: PastoDto, event?: Event): void {
    event?.stopPropagation();
    if (!pasto.id || pasto.id <= 0) return;
    if (pasto.eliminabile === false) {
      this.showError('Non puoi rinominare un pasto default.');
      return;
    }
    const nuovoNome = prompt('Nuovo nome pasto:', pasto.nome);
    if (nuovoNome == null) return;
    const nome = nuovoNome.trim();
    if (!nome) return;
    this.mealService.update(pasto.id, {
      nome,
      descrizione: pasto.descrizione ?? undefined,
      ordineVisualizzazione: pasto.ordineVisualizzazione
    }).subscribe({
      next: (updated) => {
        this.pasti = this.pasti.map(p => p.id === updated.id ? { ...p, ...updated } : p);
        if (this.pastoEspansoKey === this.pastoKey(pasto)) {
          this.pastoEspansoLabel = updated.nome;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore rinomina pasto:', err);
        this.showError('Errore nella rinomina del pasto.');
      }
    });
  }

  onEliminaPasto(pasto: PastoDto, event?: Event): void {
    event?.stopPropagation();
    if (!pasto.id || pasto.id <= 0) return;
    if (pasto.eliminabile === false) {
      this.showError('Non puoi eliminare un pasto default.');
      return;
    }
    if (!confirm(`Eliminare il pasto "${pasto.nome}"?`)) return;

    this.mealService.delete(pasto.id).subscribe({
      next: () => {
        const key = this.pastoKey(pasto);
        this.pasti = this.pasti.filter(p => p.id !== pasto.id);
        if (this.pastoEspansoKey === key) {
          this.pastoEspansoKey = undefined;
          this.pastoEspansoLabel = undefined;
        }
        this.syncAlternativeState();
        this.updateMacroChartFromPasti();
        this.showSuccess('Pasto eliminato.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore eliminazione pasto:', err);
        this.showError('Errore nell’eliminazione del pasto.');
      }
    });
  }

  onDisplayNameChange(event: { alimentoPastoId: number; nome: string | null }): void {
    if (!this.schedaId) {
      this.showError('Errore: schedaId mancante.');
      return;
    }

    const call$ = event.nome
      ? this.alimentoPastoDisplayNameService.set(this.schedaId, event.alimentoPastoId, event.nome)
      : this.alimentoPastoDisplayNameService.delete(this.schedaId, event.alimentoPastoId);

    call$.subscribe({
      next: (updated) => {
        this.pasti = this.pasti.map(p => ({
          ...p,
          alimentiPasto: p.alimentiPasto?.map(ap => ap.id === updated.id ? { ...ap, ...updated } : ap)
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore aggiornamento nome visualizzato alimento:', err);
        this.showError('Errore aggiornamento nome alimento.');
      }
    });
  }

  onAlternativeDisplayNameChange(event: { alternativaId: number; nome: string | null }): void {
    const call$ = event.nome
      ? this.alternativoService.setDisplayName(event.alternativaId, event.nome)
      : this.alternativoService.deleteDisplayName(event.alternativaId);

    call$.subscribe({
      next: (updated) => {
        // Update local alternatives arrays with the new display name
        for (const key of Object.keys(this.alternativeByAlimentoPastoId)) {
          const list = this.alternativeByAlimentoPastoId[Number(key)];
          if (!list) continue;
          for (let i = 0; i < list.length; i++) {
            if (list[i]?.savedId === updated.id) {
              list[i] = { ...list[i]!, nomeCustom: updated.nomeCustom, nomeVisualizzato: updated.nomeVisualizzato };
            }
          }
        }
        for (const key of Object.keys(this.alternativeByPastoId)) {
          const list = this.alternativeByPastoId[Number(key)];
          if (!list) continue;
          for (let i = 0; i < list.length; i++) {
            if (list[i]?.savedId === updated.id) {
              list[i] = { ...list[i]!, nomeCustom: updated.nomeCustom, nomeVisualizzato: updated.nomeVisualizzato };
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore aggiornamento nome alternativa:', err);
        this.showError('Errore aggiornamento nome alternativa.');
      }
    });
  }



  // --- AZIONI ALIMENTI (AGGIUNGI, RIMUOVI, MODIFICA) ---

  onAggiungiAlimento(alimento: AlimentoBaseDto, forzaInserimento: boolean = false, quantita: number = 100): void {
    if (!alimento.id) return;
    if (!this.pastoEspansoKey) {
      this.showError('Seleziona prima un pasto cliccando sulla freccia.');
      return;
    }
    if (!this.schedaId) {
      this.showError('Errore: schedaId mancante.');
      return;
    }

    const pasto = this.getPastoByKey(this.pastoEspansoKey);
    if (!pasto) {
      this.showError('Pasto non trovato.');
      return;
    }

    // Se il pasto non è ancora salvato (id = -1), lo creiamo prima
    if (!pasto.id || pasto.id === -1) {
      this.loading = true;
      this.cdr.detectChanges();

      const form: PastoFormDto = {
        nome: pasto.nome,
        scheda: { id: this.schedaId },
        orarioInizio: pasto.orarioInizio,
        orarioFine: pasto.orarioFine
      };

      this.pastoService.create(form).subscribe({
        next: (pastoCreato) => {
          // Aggiorna il pasto locale con l'id reale
          const index = this.pasti.findIndex(p => p.nome === pasto.nome);
          if (index !== -1) {
            this.pasti = this.pasti.map((p, i) => i === index ? pastoCreato : p);
          }
          this.syncAlternativeState();
          // Ora aggiungi l'alimento con il pasto appena creato
          this.aggiungiAlimentoAPasto(pastoCreato, alimento, forzaInserimento, quantita);
        },
        error: (err) => {
          console.error('Errore creazione pasto:', err);
          this.showError('Errore nella creazione del pasto: ' + (err.error?.message || err.message || 'Errore sconosciuto'));
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Il pasto esiste già, aggiungi direttamente
      this.aggiungiAlimentoAPasto(pasto, alimento, forzaInserimento, quantita);
    }
  }

  onDettaglioAlimento(alimento: AlimentoBaseDto): void {
    if (!alimento?.id) return;
    this.modalAlimentoOpen = true;
    this.modalAlimentoLoading = true;
    this.modalAlimento = undefined;
    this.modalQuantita = 100;
    this.cdr.detectChanges();

    this.alimentoService.getDettaglio(alimento.id).subscribe({
      next: (full) => {
        this.modalAlimento = full;
        this.modalAlimentoLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.modalAlimento = alimento;
        this.modalAlimentoLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModalAlimento(): void {
    this.modalAlimentoOpen = false;
    this.modalAlimentoLoading = false;
    this.modalAlimento = undefined;
    this.cdr.detectChanges();
  }

  onModalAddRequested(e: { alimento: AlimentoBaseDto; quantita: number }): void {
    this.modalAlimentoOpen = false;
    this.modalAlimentoLoading = false;
    const alimento = e.alimento;
    const quantita = Math.max(1, Math.round(e.quantita || 0));
    this.cdr.detectChanges();
    this.onAggiungiAlimento(alimento, false, quantita);
  }

  /**
   * Aggiunge un alimento a un pasto esistente (con id valido)
   */
  private aggiungiAlimentoAPasto(pasto: PastoDto, alimento: AlimentoBaseDto, forzaInserimento: boolean, quantita: number): void {
    const req: AlimentoPastoRequest = {
      pasto: { id: pasto.id },
      alimento: { id: alimento.id! },
      quantita: quantita,
      forzaInserimento: forzaInserimento
    };

    this.alimentoPastoService.associa(req).subscribe({
      next: (pastoAggiornato) => {
        // Mutazione locale: aggiorna solo alimentiPasto senza sostituire l'intero array
        const target = this.pasti.find(p => p.id === pasto.id);
        if (target) target.alimentiPasto = pastoAggiornato.alimentiPasto;
        this.syncAlternativeState();
        this.updateMacroChartFromPasti();
        this.showSuccess(`${alimento.nome} aggiunto!`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.error?.error || err.message || 'Errore generico';
        if (errorMsg.includes('WARNING_RESTRIZIONE')) {
          if (confirm(errorMsg + "\nVuoi procedere comunque?")) {
            this.onAggiungiAlimento(alimento, true, quantita);
          }
        } else {
          this.showError(errorMsg);
        }
        this.cdr.detectChanges();
      }
    });
  }

  onRimuoviAlimento(pasto: PastoDto, alimentoId: number): void {
    if (!confirm('Rimuovere questo alimento?')) return;
    this.alimentoPastoService.remove(pasto.id, alimentoId).subscribe({
      next: (pastoAggiornato) => {
        // Mutazione locale: aggiorna solo alimentiPasto senza sostituire l'intero array
        const target = this.pasti.find(p => p.id === pasto.id);
        if (target) target.alimentiPasto = pastoAggiornato.alimentiPasto;
        this.syncAlternativeState();
        this.updateMacroChartFromPasti();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.showError("Impossibile rimuovere l'alimento");
      }
    });
  }

  onAggiornaQuantita(pasto: PastoDto, alimentoId: number, nuovaQuantita: number): void {
    if (nuovaQuantita <= 0) return;

    // 1. OPTIMISTIC UI UPDATE - immediate
    const ap = pasto.alimentiPasto?.find(a => a.alimento?.id === alimentoId);
    if (ap) {
      ap.quantita = nuovaQuantita;
      this.pasti = [...this.pasti];
      this.recomputeAlternativesForAlimentoPasto(ap.id);
      this.updateMacroChartFromPasti();
      this.cdr.detectChanges(); // Macro totals update immediately
    }

    // 2. QUEUE FOR DEBOUNCED BACKEND CALL
    const req: AlimentoPastoRequest = {
      pasto: { id: pasto.id },
      alimento: { id: alimentoId },
      quantita: nuovaQuantita
    };
    const key = `${pasto.id}_${alimentoId}`;
    if (ap?.id) this.alimentoPastoIdByKey.set(key, ap.id);
    this.pendingAlimentoUpdates.set(key, req);
    this.hasPendingChanges = true;
    this.alimentoQuantitaSubject.next(req);
  }

  onSalvaOrariPasto(pasto: PastoDto): void {
    if (!this.schedaId) return;
    const form = {
      id: pasto.id,
      nome: pasto.nome,
      scheda: { id: this.schedaId },
      orarioInizio: pasto.orarioInizio,
      orarioFine: pasto.orarioFine
    };
    this.pastoService.update(form as any).subscribe({
      next: () => console.log('Orari salvati'),
      error: () => this.showError('Errore salvataggio orari')
    });
  }

  navigateToCliente(): void {
    this.router.navigate(['/clienti', this.clienteId]);
  }

  // --- CALCOLI (Invariati) ---
  calcolaMacro(ap: AlimentoPastoDto, macro: MacroType): number {
    const macros = ap.alimento?.macroNutrienti;
    if (!macros) return 0;
    return ((macros as any)[macro] || 0) * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100);
  }
  calcolaTotaleCalorico(pasto: PastoDto): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => {
      const cal = ap.alimento?.macroNutrienti?.calorie || 0;
      return sum + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
    }, 0);
  }
  calcolaTotaleMacro(pasto: PastoDto, macro: MacroType): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => sum + this.calcolaMacro(ap, macro), 0);
  }
  calcolaTotaleGiornaliero(macro: MacroType): number {
    return this.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleMacro(pasto, macro), 0);
  }
  calcolaTotaleCalorieGiornaliere(): number {
    return this.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleCalorico(pasto), 0);
  }

  /** Feature 11: Total food items across all meals */
  get totalAlimentiCount(): number {
    return this.pasti.reduce((sum, pasto) => sum + (pasto.alimentiPasto?.length || 0), 0);
  }

  /** Feature 12: Macro percentage (proportion of total grams) */
  macroPercentage(macro: MacroType): number {
    const p = this.calcolaTotaleGiornaliero('proteine');
    const c = this.calcolaTotaleGiornaliero('carboidrati');
    const g = this.calcolaTotaleGiornaliero('grassi');
    const total = p + c + g;
    if (total === 0) return 0;
    const val = macro === 'proteine' ? p : macro === 'carboidrati' ? c : g;
    return (val / total) * 100;
  }

  calcolaMacroDaAlimento(alimento: AlimentoBaseDto, quantita: number, macro: MacroType): number {
    const macros = alimento?.macroNutrienti;
    if (!macros) return 0;
    return ((macros as any)[macro] || 0) * (quantita || 0) / (alimento?.misuraInGrammi || 100);
  }

  protected createMacroChart(canvas: HTMLCanvasElement, config: any): Chart {
    return new Chart(canvas, config);
  }

  private updateMacroChartFromPasti(): void {
    const totals = this.pasti.reduce(
      (acc, pasto) => {
        for (const ap of (pasto.alimentiPasto || [])) {
          const alimento = ap?.alimento;
          if (!alimento?.macroNutrienti) continue;
          const misura = alimento.misuraInGrammi || 100;
          const qty = ap.quantita || 0;
          acc.proteine += (alimento.macroNutrienti.proteine || 0) * qty / misura;
          acc.carboidrati += (alimento.macroNutrienti.carboidrati || 0) * qty / misura;
          acc.grassi += (alimento.macroNutrienti.grassi || 0) * qty / misura;
        }
        return acc;
      },
      { proteine: 0, carboidrati: 0, grassi: 0 }
    );

    const sum = totals.proteine + totals.carboidrati + totals.grassi;
    this.macroChartHasData = sum > 0;

    if (!this.macroChartHasData) {
      if (this.macroChart) {
        this.macroChart.destroy();
        this.macroChart = undefined;
      }
      this.macroChartRenderQueued = false;
      return;
    }

    const canvas = this.macroPieChart?.nativeElement;
    if (!canvas) {
      if (!this.macroChartRenderQueued) {
        this.macroChartRenderQueued = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.macroChartRenderQueued = false;
          this.updateMacroChartFromPasti();
        }, 0);
      }
      return;
    }

    const data = [totals.proteine, totals.carboidrati, totals.grassi];
    const labels = ['Proteine', 'Carboidrati', 'Grassi'];
    const colors = ['#3498db', '#e67e22', '#27ae60'];
    const textColor = this.isDarkMode ? '#e5e7eb' : '#111827';

    if (this.macroChart) {
      this.macroChart.data.labels = labels;
      this.macroChart.data.datasets[0].data = data as any;
      (this.macroChart.data.datasets[0] as any).borderColor = this.isDarkMode ? '#111827' : '#ffffff';
      (this.macroChart.data.datasets[0] as any).backgroundColor = colors;
      const legendLabels: any = (this.macroChart.options?.plugins as any)?.legend?.labels;
      if (legendLabels) legendLabels.color = textColor;
      this.macroChart.update();
      this.updateMealChartFromPasti();
      return;
    }

    this.macroChart = this.createMacroChart(canvas, {
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
        animation: {
          duration: 600
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const label = String(ctx.label || '');
                const value = Number(ctx.raw || 0);
                const pct = sum > 0 ? (value / sum) * 100 : 0;
                const grams = value.toFixed(1).replace('.', ',');
                return `${label}: ${grams} g (${pct.toFixed(2).replace('.', ',')}%)`;
              }
            }
          }
        }
      }
    });
    this.updateMealChartFromPasti();
  }

  private updateMealChartFromPasti(): void {
    const canvas = this.mealDonutChart?.nativeElement;
    const kcalTot = this.calcolaTotaleCalorieGiornaliere();
    const textColor = this.isDarkMode ? '#e5e7eb' : '#111827';
    const borderColor = this.isDarkMode ? '#111827' : '#ffffff';

    type MealKey = 'colazione' | 'pranzo' | 'spuntini' | 'cena';
    const groups = [
      { key: 'colazione' as MealKey, label: 'Colazione', color: '#3498db' },
      { key: 'pranzo' as MealKey, label: 'Pranzo', color: '#e67e22' },
      { key: 'spuntini' as MealKey, label: 'Spuntini', color: '#8e44ad' },
      { key: 'cena' as MealKey, label: 'Cena', color: '#27ae60' }
    ] as const;

    const kcalByKey: Record<MealKey, number> = { colazione: 0, pranzo: 0, spuntini: 0, cena: 0 };
    for (const pasto of (this.pasti ?? [])) {
      const name = String((pasto as any)?.nome || '').toLowerCase();
      const kcal = this.calcolaTotaleCalorico(pasto);
      if (name.includes('colazione')) kcalByKey.colazione += kcal;
      else if (name.includes('pranzo')) kcalByKey.pranzo += kcal;
      else if (name.includes('cena')) kcalByKey.cena += kcal;
      else if (name.includes('merenda') || name.includes('spuntino')) kcalByKey.spuntini += kcal;
      else kcalByKey.spuntini += kcal;
    }

    const values = groups.map(g => kcalByKey[g.key] || 0);
    const labels = groups.map(g => g.label);
    const colors = groups.map(g => g.color);
    const hasAny = values.some(v => v > 0);
    this.mealChartHasData = hasAny && kcalTot > 0;
    this.mealBreakdown = groups.map((g, i) => {
      const kcal = values[i] || 0;
      const pct = kcalTot > 0 ? (kcal / kcalTot) * 100 : 0;
      return { label: g.label, kcal, pct: Number(pct.toFixed(2)), color: g.color, index: i };
    });

    if (!canvas) return;

    if (!this.mealChartHasData) {
      if (this.mealChart) {
        this.mealChart.destroy();
        this.mealChart = undefined;
      }
      return;
    }

    if (this.mealChart) {
      this.mealChart.data.labels = labels;
      this.mealChart.data.datasets[0].data = values as any;
      (this.mealChart.data.datasets[0] as any).backgroundColor = colors;
      (this.mealChart.data.datasets[0] as any).borderColor = borderColor;
      const legendLabels: any = (this.mealChart.options?.plugins as any)?.legend?.labels;
      if (legendLabels) legendLabels.color = textColor;
      this.mealChart.update();
      return;
    }

    this.mealChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values as any,
            backgroundColor: colors,
            borderColor,
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: {
          duration: 600
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const label = String(ctx.label || '');
                const value = Number(ctx.raw || 0);
                const pct = kcalTot > 0 ? (value / kcalTot) * 100 : 0;
                const kcalFmt = Math.round(value);
                return `${label}: ${kcalFmt} kcal (${pct.toFixed(2).replace('.', ',')}%)`;
              }
            }
          }
        }
      }
    });
  }

  toggleMealLegend(index: number): void {
    if (!this.mealChart) return;
    this.mealChart.toggleDataVisibility(index);
    this.mealChart.update();
  }

  isMealLegendHidden(index: number): boolean {
    if (!this.mealChart) return false;
    return !this.mealChart.getDataVisibility(index);
  }

  private syncAlternativeState(): void {
    const presentIds = new Set<number>();
    // Mappa alimentoPastoId -> AlimentoPastoDto per accesso rapido ai dati pre-caricati
    const apById = new Map<number, import('../../dto/alimento-pasto.dto').AlimentoPastoDto>();
    for (const pasto of this.pasti) {
      for (const ap of (pasto.alimentiPasto || [])) {
        if (typeof ap?.id === 'number' && ap.id > 0) {
          presentIds.add(ap.id);
          apById.set(ap.id, ap);
        }
      }
    }

    for (const idStr of Object.keys(this.alternativeByAlimentoPastoId)) {
      const id = Number(idStr);
      if (!presentIds.has(id)) delete this.alternativeByAlimentoPastoId[id];
    }

    for (const key of Object.keys(this.alternativeUi)) {
      const alimentoPastoId = Number(key.split('_')[0] || 'NaN');
      if (!presentIds.has(alimentoPastoId)) delete this.alternativeUi[key];
    }

    for (const id of presentIds) {
      if (!this.alternativeByAlimentoPastoId[id] || this.alternativeByAlimentoPastoId[id].length === 0) {
        // Prova a popolare dalle alternative pre-caricate nel DTO (JOIN FETCH)
        const ap = apById.get(id);
        if (ap?.alternative && ap.alternative.length > 0) {
          this.alternativeByAlimentoPastoId[id] = ap.alternative.map(alt => ({
            alimento: alt.alimentoAlternativo,
            quantita: alt.quantita,
            mode: this.fromBackendMode(alt.mode),
            manual: alt.manual ?? true,
            savedId: alt.id,
            saving: false,
            nomeCustom: alt.nomeCustom,
            nomeVisualizzato: alt.nomeVisualizzato
          }));
          this.alternativeByAlimentoPastoId[id].push(null);
        } else if (ap?.alternative) {
          // alternative array presente ma vuoto → nessuna alternativa
          this.alternativeByAlimentoPastoId[id] = [null];
        } else {
          // Nessun dato pre-caricato (es. alimento appena aggiunto) → inizializza vuoto
          this.alternativeByAlimentoPastoId[id] = [null];
        }
      } else {
        this.ensureAlternativeEntry(id);
        this.recomputeAlternativesForAlimentoPasto(id);
      }
    }
  }

  private loadAlternativesFromBackend(alimentoPastoId: number): void {
    this.alternativoService.listCompat(alimentoPastoId).subscribe({
      next: (alternatives) => {
        if (alternatives.length > 0) {
          // Convert backend DTOs to local AlternativeProposal type
          this.alternativeByAlimentoPastoId[alimentoPastoId] = alternatives.map(alt => ({
            alimento: alt.alimentoAlternativo,
            quantita: alt.quantita,
            mode: this.fromBackendMode(alt.mode),
            manual: alt.manual ?? true,
            savedId: alt.id,
            saving: false,
            nomeCustom: alt.nomeCustom,
            nomeVisualizzato: alt.nomeVisualizzato
          }));
          // Add null slot for "add new" button
          this.alternativeByAlimentoPastoId[alimentoPastoId].push(null);
        } else {
          this.alternativeByAlimentoPastoId[alimentoPastoId] = [null];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback to empty state on error
        this.alternativeByAlimentoPastoId[alimentoPastoId] = [null];
      }
    });
  }

  /**
   * Carica tutte le alternative di tutti i pasti in una sola chiamata batch.
   * Sostituisce N chiamate loadAlternativesForPasto() con 1 sola.
   */
  private loadAllAlternativesForScheda(schedaId: number): void {
    this.alternativoService.listByScheda(schedaId).subscribe({
      next: (mapByPastoId) => {
        // Popola alternativeByPastoId per ogni pasto
        for (const pastoIdStr of Object.keys(mapByPastoId)) {
          const pastoId = Number(pastoIdStr);
          const alternatives = mapByPastoId[pastoId];
          if (alternatives && alternatives.length > 0) {
            this.alternativeByPastoId[pastoId] = alternatives.map(alt => ({
              alimento: alt.alimentoAlternativo,
              quantita: alt.quantita,
              mode: this.fromBackendMode(alt.mode),
              manual: alt.manual ?? true,
              savedId: alt.id,
              saving: false,
              nomeCustom: alt.nomeCustom,
              nomeVisualizzato: alt.nomeVisualizzato
            }));
            this.alternativeByPastoId[pastoId].push(null);
          } else {
            this.alternativeByPastoId[pastoId] = [null];
          }
        }
        // Pasti senza alternative: imposta [null]
        for (const pasto of this.pasti) {
          if (pasto?.id && !this.alternativeByPastoId[pasto.id]) {
            this.alternativeByPastoId[pasto.id] = [null];
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: imposta [null] per tutti i pasti
        for (const pasto of this.pasti) {
          if (pasto?.id) {
            this.alternativeByPastoId[pasto.id] = [null];
          }
        }
      }
    });
  }

  private loadAlternativesForPasto(pastoId: number): void {
    this.alternativoService.listByPasto(pastoId).subscribe({
      next: (alternatives) => {
        if (alternatives.length > 0) {
          this.alternativeByPastoId[pastoId] = alternatives.map(alt => ({
            alimento: alt.alimentoAlternativo,
            quantita: alt.quantita,
            mode: this.fromBackendMode(alt.mode),
            manual: alt.manual ?? true,
            savedId: alt.id,
            saving: false,
            nomeCustom: alt.nomeCustom,
            nomeVisualizzato: alt.nomeVisualizzato
          }));
          this.alternativeByPastoId[pastoId].push(null);
        } else {
          this.alternativeByPastoId[pastoId] = [null];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.alternativeByPastoId[pastoId] = [null];
      }
    });
  }

  private ensureAlternativeEntry(alimentoPastoId: number): void {
    const existing = this.alternativeByAlimentoPastoId[alimentoPastoId];
    if (!existing || existing.length === 0) {
      this.alternativeByAlimentoPastoId[alimentoPastoId] = [null];
      return;
    }

    const firstNullIndex = existing.findIndex(v => v === null);
    if (firstNullIndex !== -1) {
      for (let i = existing.length - 1; i > firstNullIndex; i--) {
        if (existing[i] === null) existing.splice(i, 1);
      }
    }
  }

  private alternativeKey(alimentoPastoId: number, slot: number): string {
    return `${alimentoPastoId}_${slot}`;
  }

  private toBackendMode(mode: AlternativeMode): AlternativeModeDto {
    switch (mode) {
      case 'proteine':
        return 'PROTEINE';
      case 'carboidrati':
        return 'CARBOIDRATI';
      case 'grassi':
        return 'GRASSI';
      case 'calorie':
      default:
        return 'CALORIE';
    }
  }

  private fromBackendMode(mode?: AlternativeModeDto | null): AlternativeMode {
    switch (mode) {
      case 'PROTEINE':
        return 'proteine';
      case 'CARBOIDRATI':
        return 'carboidrati';
      case 'GRASSI':
        return 'grassi';
      case 'CALORIE':
      default:
        return 'calorie';
    }
  }

  getAlternative(alimentoPastoId: number, slot: number): AlternativeProposal | null {
    this.ensureAlternativeEntry(alimentoPastoId);
    return this.alternativeByAlimentoPastoId[alimentoPastoId]?.[slot] ?? null;
  }

  getAlternativeEntries(alimentoPastoId: number): AlternativeEntry[] {
    this.ensureAlternativeEntry(alimentoPastoId);
    const list = this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
    const entries: AlternativeEntry[] = [];
    list.forEach((alt, index) => {
      if (alt) entries.push({ index, alt });
    });
    return entries;
  }

  private computeAlternativePriorita(alimentoPastoId: number, slot: number): number {
    const entries = this.getAlternativeEntries(alimentoPastoId);
    const pos = entries.findIndex(e => e.index === slot);
    return (pos >= 0 ? pos : entries.length) + 1;
  }

  hasPendingAlternativeSlot(alimentoPastoId: number): boolean {
    this.ensureAlternativeEntry(alimentoPastoId);
    const list = this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
    return list.some(v => v === null);
  }

  getPendingAlternativeSlotIndex(alimentoPastoId: number): number {
    this.ensureAlternativeEntry(alimentoPastoId);
    const list = this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
    return list.findIndex(v => v === null);
  }

  addAlternativeSlot(alimentoPasto: AlimentoPastoDto): void {
    this.ensureAlternativeEntry(alimentoPasto.id);
    const existingPending = this.getPendingAlternativeSlotIndex(alimentoPasto.id);
    if (existingPending !== -1) {
      this.startAlternativeEdit(alimentoPasto, existingPending);
      return;
    }
    this.alternativeByAlimentoPastoId[alimentoPasto.id].push(null);
    const index = this.alternativeByAlimentoPastoId[alimentoPasto.id].length - 1;
    this.startAlternativeEdit(alimentoPasto, index);
    this.cdr.detectChanges();
  }

  getAlternativeUi(alimentoPastoId: number, slot: number) {
    const key = this.alternativeKey(alimentoPastoId, slot);
    if (!this.alternativeUi[key]) {
      this.alternativeUi[key] = { editing: false, query: '', loading: false, results: [] };
    }
    return this.alternativeUi[key];
  }

  private findAlimentoPastoById(alimentoPastoId: number): AlimentoPastoDto | undefined {
    for (const pasto of this.pasti) {
      const found = (pasto.alimentiPasto || []).find(ap => ap.id === alimentoPastoId);
      if (found) return found;
    }
    return undefined;
  }

  private getMacroValueForAlimento(alimento: AlimentoBaseDto, mode: AlternativeMode): number {
    return ((alimento?.macroNutrienti as any)?.[mode] || 0) as number;
  }

  private suggestAlternativeQuantity(alimentoPasto: AlimentoPastoDto, alternative: AlimentoBaseDto, mode: AlternativeMode): number | null {
    const target = this.calcolaMacro(alimentoPasto, mode);
    const altValue = this.getMacroValueForAlimento(alternative, mode);
    const altMisura = alternative?.misuraInGrammi || 100;
    if (!target || target <= 0) return 0;
    if (!altValue || altValue <= 0) return null;
    if (!altMisura || altMisura <= 0) return null;
    const qty = target * altMisura / altValue;
    const rounded = Math.round(qty);
    return Math.max(1, Math.min(rounded, 9999));
  }

  private recomputeAlternativesForAlimentoPasto(alimentoPastoId: number): void {
    const ap = this.findAlimentoPastoById(alimentoPastoId);
    if (!ap) return;
    const proposals = this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
    proposals.forEach((proposal, idx) => {
      if (!proposal) return;
      if (proposal.manual) return;
      const suggested = this.suggestAlternativeQuantity(ap, proposal.alimento, proposal.mode);
      if (suggested === null) return;
      this.alternativeByAlimentoPastoId[alimentoPastoId][idx] = {
        ...proposal,
        quantita: suggested
      };
    });
  }

  private flushView(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  startAlternativeEdit(alimentoPasto: AlimentoPastoDto, slot: number): void {
    const ui = this.getAlternativeUi(alimentoPasto.id, slot);
    const existing = this.getAlternative(alimentoPasto.id, slot);
    ui.editing = true;
    ui.query = existing?.alimento?.nome || '';
    this.onAlternativeQueryChange(alimentoPasto, slot, ui.query);
  }

  closeAlternativeEdit(alimentoPastoId: number, slot: number): void {
    const ui = this.getAlternativeUi(alimentoPastoId, slot);
    ui.editing = false;
    ui.loading = false;
    ui.results = [];
    this.flushView();
  }

  onAlternativeQueryChange(alimentoPasto: AlimentoPastoDto, slot: number, query: string): void {
    const ui = this.getAlternativeUi(alimentoPasto.id, slot);
    ui.query = query;

    const trimmed = (query || '').trim();
    if (!trimmed) {
      ui.loading = false;
      ui.results = [];
      this.flushView();
      return;
    }

    const key = this.alternativeKey(alimentoPasto.id, slot);
    const prev = this.alternativeSearchTimers[key];
    if (prev) window.clearTimeout(prev);

    ui.loading = true;
    this.flushView();
    this.alternativeSearchTimers[key] = window.setTimeout(() => {
      this.alimentoService.search(trimmed).subscribe({
        next: (results) => {
          ui.results = this.filterAlternativeResults(alimentoPasto, slot, results).slice(0, 8);
          ui.loading = false;
          this.flushView();
        },
        error: () => {
          ui.loading = false;
          ui.results = [];
          this.flushView();
        }
      });
    }, 250);
  }

  private filterAlternativeResults(alimentoPasto: AlimentoPastoDto, slot: number, results: AlimentoBaseDto[]): AlimentoBaseDto[] {
    const baseId = alimentoPasto.alimento?.id;
    const chosen = new Set<number>();
    const current = this.alternativeByAlimentoPastoId[alimentoPasto.id] || [];
    current.forEach((a, idx) => {
      if (idx === slot) return;
      if (a?.alimento?.id) chosen.add(a.alimento.id);
    });

    return results.filter((a) => {
      if (!a?.id) return false;
      if (baseId && a.id === baseId) return false;
      if (chosen.has(a.id)) return false;
      return true;
    });
  }

  selectAlternative(alimentoPasto: AlimentoPastoDto, slot: number, alimento: AlimentoBaseDto): void {
    this.ensureAlternativeEntry(alimentoPasto.id);
    const mode = this.defaultAlternativeMode;
    const suggested = this.suggestAlternativeQuantity(alimentoPasto, alimento, mode);
    const quantita = suggested ?? 100;

    while (this.alternativeByAlimentoPastoId[alimentoPasto.id].length <= slot) {
      this.alternativeByAlimentoPastoId[alimentoPasto.id].push(null);
    }

    // Optimistic UI update
    this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
      alimento,
      quantita,
      mode,
      manual: false,
      saving: true
    };
    this.closeAlternativeEdit(alimentoPasto.id, slot);

    // Persist to backend
    const body: AlimentoAlternativoUpsertDto = {
      alimentoAlternativoId: alimento.id!,
      quantita: null,
      priorita: this.computeAlternativePriorita(alimentoPasto.id, slot),
      mode: this.toBackendMode(mode),
      manual: false,
      note: null
    };
    this.alternativoService.createCompat(alimentoPasto.id, body).pipe(
      timeout(8000)
    ).subscribe({
      next: (saved) => {
        // Update with saved ID for future operations
        const current = this.alternativeByAlimentoPastoId[alimentoPasto.id]?.[slot];
        if (current) {
          this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
            ...current,
            savedId: saved.id,
            quantita: saved.quantita,
            manual: saved.manual ?? current.manual,
            mode: this.fromBackendMode(saved.mode),
            saving: false
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore salvataggio alternativa:', err);
        this.showAlternativeHttpError(err, 'Errore nel salvataggio dell\'alternativa');
        // Rollback UI on error
        this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = null;
        this.cdr.detectChanges();
      }
    });
  }

  private clearAlternativeUiForAlimentoPasto(alimentoPastoId: number): void {
    for (const key of Object.keys(this.alternativeUi)) {
      if (key.startsWith(`${alimentoPastoId}_`)) delete this.alternativeUi[key];
    }
    for (const key of Object.keys(this.alternativeSearchTimers)) {
      if (!key.startsWith(`${alimentoPastoId}_`)) continue;
      const t = this.alternativeSearchTimers[key];
      if (t) window.clearTimeout(t);
      delete this.alternativeSearchTimers[key];
    }
  }

  removeAlternative(alimentoPastoId: number, index: number): void {
    this.ensureAlternativeEntry(alimentoPastoId);
    const list = this.alternativeByAlimentoPastoId[alimentoPastoId];
    if (!list || index < 0 || index >= list.length) return;

    const toRemove = list[index];
    const savedId = toRemove?.savedId;

    // Optimistic UI update
    list.splice(index, 1);
    this.clearAlternativeUiForAlimentoPasto(alimentoPastoId);
    if (list.length === 0) list.push(null);
    this.ensureAlternativeEntry(alimentoPastoId);
    this.cdr.detectChanges();

    // Delete from backend if saved
    if (savedId) {
      this.alternativoService.deleteCompat(alimentoPastoId, savedId).subscribe({
        error: (err) => {
          console.error('Errore eliminazione alternativa:', err);
          this.showAlternativeHttpError(err, 'Errore nell\'eliminazione dell\'alternativa');
        }
      });
    }
  }

  updateAlternativeMode(alimentoPasto: AlimentoPastoDto, slot: number, mode: AlternativeMode): void {
    const proposal = this.getAlternative(alimentoPasto.id, slot);
    if (!proposal) return;
    const suggested = this.suggestAlternativeQuantity(alimentoPasto, proposal.alimento, mode);
    this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
      ...proposal,
      mode,
      manual: false,
      quantita: suggested ?? proposal.quantita
    };
    this.cdr.detectChanges();

    if (proposal.savedId) {
      this.setAlternativeSaving(alimentoPasto.id, slot, true);
      const body: AlimentoAlternativoUpsertDto = {
        id: proposal.savedId,
        alimentoAlternativoId: proposal.alimento.id!,
        quantita: null,
        priorita: this.computeAlternativePriorita(alimentoPasto.id, slot),
        mode: this.toBackendMode(mode),
        manual: false,
        note: null
      };
      this.alternativoService.updateCompat(alimentoPasto.id, proposal.savedId, body).pipe(
        timeout(8000),
        finalize(() => this.setAlternativeSaving(alimentoPasto.id, slot, false))
      ).subscribe({
        next: (saved) => {
          const current = this.alternativeByAlimentoPastoId[alimentoPasto.id]?.[slot];
          if (current) {
            this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
              ...current,
              quantita: saved.quantita,
              manual: saved.manual ?? current.manual,
              mode: this.fromBackendMode(saved.mode),
              saving: false
            };
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showAlternativeHttpError(err, 'Errore nel salvataggio della modalità alternativa');
        }
      });
    }
  }

  updateAlternativeQuantity(alimentoPastoId: number, slot: number, quantita: number): void {
    const proposal = this.getAlternative(alimentoPastoId, slot);
    if (!proposal) return;
    if (!quantita || quantita <= 0) return;

    // 1. OPTIMISTIC UI UPDATE - immediate
    this.alternativeByAlimentoPastoId[alimentoPastoId][slot] = {
      ...proposal,
      quantita,
      manual: true
    };
    this.cdr.detectChanges();

    // 2. QUEUE FOR DEBOUNCED BACKEND CALL (if already saved)
    // NOTE: NON settare saving=true qui — blocca l'input durante il debounce.
    // Il salvataggio avviene silenziosamente in background come per gli alimenti base.
    if (proposal.savedId) {
      const update = {
        alimentoPastoId,
        alternativeId: proposal.savedId,
        body: {
          id: proposal.savedId,
          alimentoAlternativoId: proposal.alimento.id!,
          quantita,
          priorita: this.computeAlternativePriorita(alimentoPastoId, slot),
          mode: this.toBackendMode(proposal.mode),
          manual: true,
          note: null
        } as AlimentoAlternativoUpsertDto
      };
      this.pendingAlternativeUpdates.set(proposal.savedId, update);
      this.hasPendingChanges = true;
      this.alternativeQuantitaSubject.next(update);
    }
  }

  resetAlternativeQuantity(alimentoPasto: AlimentoPastoDto, slot: number): void {
    const proposal = this.getAlternative(alimentoPasto.id, slot);
    if (!proposal) return;
    const suggested = this.suggestAlternativeQuantity(alimentoPasto, proposal.alimento, proposal.mode);
    this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
      ...proposal,
      manual: false,
      quantita: suggested ?? proposal.quantita
    };
    this.cdr.detectChanges();

    if (proposal.savedId) {
      this.setAlternativeSaving(alimentoPasto.id, slot, true);
      const body: AlimentoAlternativoUpsertDto = {
        id: proposal.savedId,
        alimentoAlternativoId: proposal.alimento.id!,
        quantita: null,
        priorita: this.computeAlternativePriorita(alimentoPasto.id, slot),
        mode: this.toBackendMode(proposal.mode),
        manual: false,
        note: null
      };
      this.alternativoService.updateCompat(alimentoPasto.id, proposal.savedId, body).pipe(
        timeout(8000),
        finalize(() => this.setAlternativeSaving(alimentoPasto.id, slot, false))
      ).subscribe({
        next: (saved) => {
          const current = this.alternativeByAlimentoPastoId[alimentoPasto.id]?.[slot];
          if (current) {
            this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
              ...current,
              quantita: saved.quantita,
              manual: saved.manual ?? current.manual,
              mode: this.fromBackendMode(saved.mode),
              saving: false
            };
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showAlternativeHttpError(err, 'Errore nel reset della quantità alternativa');
        }
      });
    }
  }

  // --- SALVATAGGIO ---
  private bulkSyncAlternatives(): Observable<unknown> {
    const requests: Observable<AlimentoAlternativoDto[]>[] = [];
    for (const pasto of this.pasti) {
      for (const ap of (pasto.alimentiPasto || [])) {
        if (!ap?.id) continue;
        const entries = this.getAlternativeEntries(ap.id);
        const items: AlimentoAlternativoUpsertDto[] = entries.map((e, idx) => ({
          id: e.alt.savedId,
          alimentoAlternativoId: e.alt.alimento.id!,
          quantita: e.alt.manual ? e.alt.quantita : null,
          priorita: idx + 1,
          mode: this.toBackendMode(e.alt.mode),
          manual: e.alt.manual,
          note: null
        }));
        requests.push(this.alternativoService.bulkUpsertNested(ap.id, items).pipe(
          catchError((err) => {
            this.showAlternativeHttpError(err, 'Errore sincronizzazione alternative');
            return of([] as AlimentoAlternativoDto[]);
          })
        ));
      }
    }

    if (requests.length === 0) return of(null);

    return forkJoin(requests).pipe(
      tap((all) => {
        for (const alternatives of all) {
          for (const alt of alternatives) {
            const apId = alt.alimentoPasto?.id;
            if (!apId) continue;
            const list = this.alternativeByAlimentoPastoId[apId] || [];
            const idx = list.findIndex(p => p?.alimento?.id === alt.alimentoAlternativo?.id);
            if (idx === -1) continue;
            const current = list[idx];
            if (!current) continue;
            this.alternativeByAlimentoPastoId[apId][idx] = {
              ...current,
              savedId: alt.id,
              quantita: alt.quantita,
              manual: alt.manual ?? current.manual,
              mode: this.fromBackendMode(alt.mode)
            };
          }
        }
        this.cdr.detectChanges();
      })
    );
  }

  onSalvaScheda(): void {
    if (!this.schedaId || !this.scheda) return;

    this.saving = true;
    this.cdr.detectChanges();

    // 1. Flush all pending quantity updates immediately
    this.flushPendingChanges();

    // 2. Update scheda metadata if needed (name, active status)
    const form: any = {
      id: this.schedaId,
      nome: this.scheda.nome,
      cliente: { id: this.scheda.cliente?.id || this.clienteId },
      attiva: this.scheda.attiva
    };

    this.bulkSyncAlternatives().pipe(
      switchMap(() => this.schedaService.update(form))
    ).subscribe({
      next: (updated) => {
        this.scheda = updated;
        this.saving = false;
        this.showSuccess('Scheda salvata con successo!');
      },
      error: (err) => {
        console.error('Errore salvataggio scheda:', err);
        this.saving = false;
        this.showAlternativeHttpError(err, 'Errore nel salvataggio della scheda');
      }
    });
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
  private showError(msg: string) {
    this.errorMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
  }

  private showAlternativeHttpError(err: any, fallback: string): void {
    const status = err?.status;
    if (status === 403) {
      this.showError('Non autorizzato');
      return;
    }
    if (status === 409) {
      this.showError('Alternativa già presente');
      return;
    }
    this.showError(fallback);
  }

  private setAlternativeSaving(alimentoPastoId: number, slot: number, saving: boolean): void {
    const current = this.alternativeByAlimentoPastoId[alimentoPastoId]?.[slot];
    if (!current) return;
    this.alternativeByAlimentoPastoId[alimentoPastoId][slot] = { ...current, saving };
    this.cdr.detectChanges();
  }

  private setAlternativeSavingBySavedId(alimentoPastoId: number, savedId: number, saving: boolean): void {
    const list = this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
    const slot = list.findIndex(p => p?.savedId === savedId);
    if (slot === -1) return;
    this.setAlternativeSaving(alimentoPastoId, slot, saving);
  }

  // --- HANDLER METHODS FOR EXTRACTED COMPONENTS ---

  /**
   * Get alternatives array for an alimentoPasto (used by ListaAlternative component)
   */
  getAlternatives(alimentoPastoId: number): (AlternativeProposal | null)[] {
    this.ensureAlternativeEntry(alimentoPastoId);
    return this.alternativeByAlimentoPastoId[alimentoPastoId] || [];
  }

  /**
   * Handle alternative selection from ListaAlternative component
   */
  onAlternativeFromComponent(
    alimentoPasto: AlimentoPastoDto,
    event: { alimento: AlimentoBaseDto; quantita: number; slot: number }
  ): void {
    this.selectAlternative(alimentoPasto, event.slot, event.alimento);
  }

  /**
   * Handle alternative removal from ListaAlternative component
   */
  onAlternativeRemovedFromComponent(
    alimentoPastoId: number,
    event: { index: number; savedId?: number }
  ): void {
    this.removeAlternative(alimentoPastoId, event.index);
  }

  /**
   * Handle alternative quantity change from ListaAlternative component
   */
  onAlternativeQuantitaFromComponent(
    alimentoPastoId: number,
    event: { slot: number; quantita: number }
  ): void {
    this.updateAlternativeQuantity(alimentoPastoId, event.slot, event.quantita);
  }

  /**
   * Handle alternative mode change from ListaAlternative component
   */
  onAlternativeModeFromComponent(
    alimentoPasto: AlimentoPastoDto,
    event: { slot: number; mode: AlternativeMode }
  ): void {
    this.updateAlternativeMode(alimentoPasto, event.slot, event.mode);
  }

  // === COMPACT TABLE HELPERS ===

  toggleAlternativeExpand(alimentoPastoId: number): void {
    if (this.expandedAlternativeAlimentoIds.has(alimentoPastoId)) {
      this.expandedAlternativeAlimentoIds.delete(alimentoPastoId);
    } else {
      this.expandedAlternativeAlimentoIds.add(alimentoPastoId);
      // Ensure alternatives are loaded
      this.ensureAlternativeEntry(alimentoPastoId);
      if (!this.alternativeByAlimentoPastoId[alimentoPastoId] ||
        this.alternativeByAlimentoPastoId[alimentoPastoId].every(a => a === null)) {
        this.loadAlternativesFromBackend(alimentoPastoId);
      }
    }
    this.cdr.detectChanges();
  }

  isAlternativeExpanded(alimentoPastoId: number): boolean {
    return this.expandedAlternativeAlimentoIds.has(alimentoPastoId);
  }

  isAlimentoDaEvitare(ap: AlimentoPastoDto): boolean {
    const alimentoId = ap?.alimento?.id;
    if (!alimentoId || !this.alimentiDaEvitare?.length) return false;
    return this.alimentiDaEvitare.some(e => e.alimento?.id === alimentoId);
  }

  getTopMicroTooltip(ap: AlimentoPastoDto): string {
    const micros = ap?.alimento?.micronutrienti;
    if (!micros?.length) return '';
    return micros
      .slice()
      .sort((a: any, b: any) => (b.valore || 0) - (a.valore || 0))
      .slice(0, 3)
      .map((m: any) => `${m.micronutriente?.nome || '?'}: ${m.valore}${m.micronutriente?.unita || ''}`)
      .join(' · ');
  }

  // === AGGREGATED ALTERNATIVES PER PASTO ===

  getAggregatedAlternatives(pasto: PastoDto): (AlternativeProposal | null)[] {
    // Read directly from per-pasto map
    const list = this.alternativeByPastoId[pasto.id];
    if (!list) return [];
    return list.filter(a => a !== null) as AlternativeProposal[];
  }

  addAggregatedAlternativeSlot(pasto: PastoDto): void {
    if (!this.alternativeByPastoId[pasto.id]) {
      this.alternativeByPastoId[pasto.id] = [null];
    }
    const list = this.alternativeByPastoId[pasto.id];
    const existingNull = list.findIndex(v => v === null);
    if (existingNull === -1) {
      list.push(null);
    }
    this.cdr.detectChanges();
  }

  onAggregatedAlternativeSelected(
    pasto: PastoDto,
    event: { alimento: AlimentoBaseDto; quantita: number; slot: number }
  ): void {
    if (!this.alternativeByPastoId[pasto.id]) {
      this.alternativeByPastoId[pasto.id] = [];
    }
    const list = this.alternativeByPastoId[pasto.id];
    const mode = this.defaultAlternativeMode;

    // Use first food in meal for quantity suggestion
    const firstAp = pasto.alimentiPasto?.[0];
    const suggested = firstAp ? this.suggestAlternativeQuantity(firstAp, event.alimento, mode) : null;
    const quantita = suggested ?? event.quantita ?? 100;

    // Optimistic UI: add to per-pasto list
    const proposal: AlternativeProposal = {
      alimento: event.alimento,
      quantita,
      mode,
      manual: false,
      saving: true
    };

    // Replace null slot or append
    const nullIdx = list.findIndex(v => v === null);
    if (nullIdx !== -1) {
      list[nullIdx] = proposal;
    } else {
      list.push(proposal);
    }
    const insertedIdx = nullIdx !== -1 ? nullIdx : list.length - 1;
    this.cdr.detectChanges();

    // Persist via per-pasto endpoint
    const body: AlimentoAlternativoUpsertDto = {
      alimentoAlternativoId: event.alimento.id!,
      quantita: null,
      priorita: insertedIdx + 1,
      mode: this.toBackendMode(mode),
      manual: false,
      note: null
    };
    this.alternativoService.createForPasto(pasto.id, body).pipe(
      timeout(8000)
    ).subscribe({
      next: (saved) => {
        const current = list[insertedIdx];
        if (current) {
          list[insertedIdx] = {
            ...current,
            savedId: saved.id,
            quantita: saved.quantita,
            manual: saved.manual ?? current.manual,
            mode: this.fromBackendMode(saved.mode),
            saving: false
          };
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Errore salvataggio alternativa per pasto:', err);
        this.showAlternativeHttpError(err, 'Errore nel salvataggio dell\'alternativa');
        // Rollback
        list[insertedIdx] = null;
        this.cdr.detectChanges();
      }
    });
  }

  onAggregatedAlternativeRemoved(
    pasto: PastoDto,
    event: { index: number; savedId?: number }
  ): void {
    const list = this.alternativeByPastoId[pasto.id];
    if (!list) return;
    // Find the real index: event.index is index among non-null items
    const nonNullItems = list.map((v, i) => ({ v, i })).filter(x => x.v !== null);
    if (event.index < 0 || event.index >= nonNullItems.length) return;
    const realIndex = nonNullItems[event.index].i;
    const toRemove = list[realIndex];
    const savedId = toRemove?.savedId;

    // Optimistic UI
    list.splice(realIndex, 1);
    if (list.length === 0 || list.every(v => v === null && list.length === 0)) {
      this.alternativeByPastoId[pasto.id] = [null];
    }
    this.cdr.detectChanges();

    // Delete from backend
    if (savedId) {
      this.alternativoService.deleteForPasto(pasto.id, savedId).subscribe({
        error: (err: any) => {
          console.error('Errore eliminazione alternativa per pasto:', err);
          this.showAlternativeHttpError(err, 'Errore nell\'eliminazione dell\'alternativa');
        }
      });
    }
  }

  onAggregatedAlternativeQuantita(
    pasto: PastoDto,
    event: { slot: number; quantita: number }
  ): void {
    const list = this.alternativeByPastoId[pasto.id];
    if (!list) return;
    const nonNullItems = list.map((v, i) => ({ v, i })).filter(x => x.v !== null);
    if (event.slot < 0 || event.slot >= nonNullItems.length) return;
    const realIndex = nonNullItems[event.slot].i;
    const proposal = list[realIndex];
    if (!proposal || !event.quantita || event.quantita <= 0) return;

    // Optimistic UI
    list[realIndex] = { ...proposal, quantita: event.quantita, manual: true };
    this.cdr.detectChanges();

    // Save to backend
    if (proposal.savedId) {
      const body: AlimentoAlternativoUpsertDto = {
        id: proposal.savedId,
        alimentoAlternativoId: proposal.alimento.id!,
        quantita: event.quantita,
        priorita: event.slot + 1,
        mode: this.toBackendMode(proposal.mode),
        manual: true,
        note: null
      };
      this.alternativoService.updateForPasto(pasto.id, proposal.savedId, body).pipe(
        timeout(8000)
      ).subscribe({
        next: (saved) => {
          const current = list[realIndex];
          if (current) {
            list[realIndex] = {
              ...current,
              quantita: saved.quantita,
              manual: saved.manual ?? current.manual,
              mode: this.fromBackendMode(saved.mode),
              saving: false
            };
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.showAlternativeHttpError(err, 'Errore nel salvataggio della quantità alternativa');
        }
      });
    }
  }

  onAggregatedAlternativeMode(
    pasto: PastoDto,
    event: { slot: number; mode: AlternativeMode }
  ): void {
    const list = this.alternativeByPastoId[pasto.id];
    if (!list) return;
    const nonNullItems = list.map((v, i) => ({ v, i })).filter(x => x.v !== null);
    if (event.slot < 0 || event.slot >= nonNullItems.length) return;
    const realIndex = nonNullItems[event.slot].i;
    const proposal = list[realIndex];
    if (!proposal) return;

    // For per-pasto, suggest quantity using first food in meal
    const firstAp = pasto.alimentiPasto?.[0];
    const suggested = firstAp ? this.suggestAlternativeQuantity(firstAp, proposal.alimento, event.mode) : null;
    list[realIndex] = { ...proposal, mode: event.mode, manual: false, quantita: suggested ?? proposal.quantita };
    this.cdr.detectChanges();

    if (proposal.savedId) {
      const body: AlimentoAlternativoUpsertDto = {
        id: proposal.savedId,
        alimentoAlternativoId: proposal.alimento.id!,
        quantita: null,
        priorita: event.slot + 1,
        mode: this.toBackendMode(event.mode),
        manual: false,
        note: null
      };
      this.alternativoService.updateForPasto(pasto.id, proposal.savedId, body).pipe(
        timeout(8000)
      ).subscribe({
        next: (saved) => {
          const current = list[realIndex];
          if (current) {
            list[realIndex] = {
              ...current,
              quantita: saved.quantita,
              manual: saved.manual ?? current.manual,
              mode: this.fromBackendMode(saved.mode),
              saving: false
            };
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.showAlternativeHttpError(err, 'Errore nel salvataggio della modalità alternativa');
        }
      });
    }
  }
}
