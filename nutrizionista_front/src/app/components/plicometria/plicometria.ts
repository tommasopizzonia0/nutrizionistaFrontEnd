import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { PlicometrieApiService } from '../../services/plicometria.service';
import { PlicometriaDto, PlicometriaFormDto } from '../../dto/plicometria.dto';
import { PageResponse } from '../../dto/page-response.dto';

import {
  faCalendar,
  faChevronLeft,
  faChevronRight,
  faEdit,
  faPlus,
  faRuler,
  faTrash,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// ✅ Chart.js diretto
import { Chart } from 'chart.js/auto';

type MetodoValue =
  | 'JACKSON_POLLOCK_3'
  | 'JACKSON_POLLOCK_7'
  | 'DURNIN_WOMERSLEY'
  | 'PARILLO'
  | 'MISURAZIONE_LIBERA';

/** ✅ nuovi tipi per “Misure per sito” */
type PlicoKey =
  | 'tricipite'
  | 'bicipite'
  | 'sottoscapolare'
  | 'sovrailiaca'
  | 'addominale'
  | 'coscia'
  | 'pettorale'
  | 'ascellare'
  | 'polpaccio';

type PlicoSiteRow = {
  key: PlicoKey;
  label: string;
  mm: number;  // valore in mm
  pct: number; // 0..100 per barra normalizzata
};

@Component({
  selector: 'app-plicometria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './plicometria.html',
  styleUrls: ['./plicometria.css'],
})
export class PlicometriaComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private api = inject(PlicometrieApiService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  @Input({ required: true }) clienteId!: number;
  @Input() isDarkMode = false;

  page: PageResponse<PlicometriaDto> | null = null;
  loading = false;
  saving = false;

  // ultima misurazione mostrata nel grafico
  selected: PlicometriaDto | null = null;

  // Icone
  icCalendar = faCalendar;
  icEdit = faEdit;
  icTrash = faTrash;
  icChevronLeft = faChevronLeft;
  icChevronRight = faChevronRight;
  icRuler = faRuler;
  icPlus = faPlus;
  icView = faEye;

  // paginazione
  numeroPagina = 0;
  dimensionePagina = 10;

  // editing
  editingId: number | null = null;
  showForm = false;

  metodi: Array<{ value: MetodoValue; label: string }> = [
    { value: 'JACKSON_POLLOCK_3', label: 'Jackson Pollock 3' },
    { value: 'JACKSON_POLLOCK_7', label: 'Jackson Pollock 7' },
    { value: 'DURNIN_WOMERSLEY', label: 'Durnin & Womersley (4 pliche)' },
    { value: 'PARILLO', label: 'Parillo (manuale)' },
    { value: 'MISURAZIONE_LIBERA', label: 'Misurazione libera (manuale)' },
  ];

  form = this.fb.group({
    metodo: [null as MetodoValue | null, Validators.required],
    dataMisurazione: [null as string | null, Validators.required],

    tricipite: [null as number | null],
    bicipite: [null as number | null],
    sottoscapolare: [null as number | null],
    sovrailiaca: [null as number | null],
    addominale: [null as number | null],
    coscia: [null as number | null],
    pettorale: [null as number | null],
    ascellare: [null as number | null],
    polpaccio: [null as number | null],

    note: [null as string | null],
  });

  // ===== Chart.js state =====
  @ViewChild('plicoPie') plicoPie?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;
  private viewReady = false;

  /** ✅ meta “Misure per sito” */
  private readonly SITE_META: Array<{ key: PlicoKey; label: string }> = [
    { key: 'tricipite', label: 'Tricipite' },
    { key: 'bicipite', label: 'Bicipite' },
    { key: 'sottoscapolare', label: 'Sottoscapolare' },
    { key: 'sovrailiaca', label: 'Sovrailiaca' },
    { key: 'addominale', label: 'Addome' },
    { key: 'coscia', label: 'Coscia' },
    { key: 'pettorale', label: 'Pettorale' },
    { key: 'ascellare', label: 'Ascellare' },
    { key: 'polpaccio', label: 'Polpaccio' },
  ];

  private readonly SITE_KEYS_BY_METODO: Record<MetodoValue, PlicoKey[]> = {
  JACKSON_POLLOCK_3: ['pettorale', 'addominale', 'coscia'],
  JACKSON_POLLOCK_7: ['pettorale', 'ascellare', 'tricipite', 'sottoscapolare', 'addominale', 'sovrailiaca', 'coscia'],
  DURNIN_WOMERSLEY: ['tricipite', 'bicipite', 'sottoscapolare', 'sovrailiaca'],
  PARILLO: [], // niente pliche
  MISURAZIONE_LIBERA: [], // niente pliche (oppure metti tutti se vuoi manuale)
};

  /** ✅ getter pronto per template: righe con barra normalizzata */
get siteRows(): PlicoSiteRow[] {
  const s = this.selected as any;
  if (!s) return [];

  const metodo = (s.metodo as MetodoValue) ?? null;
  const allowed = metodo ? this.SITE_KEYS_BY_METODO[metodo] : [];

  if (!allowed?.length) return [];

  const meta = this.SITE_META.filter(m => allowed.includes(m.key));

  const raw = meta
    .map(m => {
      const v = s[m.key];
      if (v === null || v === undefined || v === '') return null;
      const mm = Number(v);
      if (!Number.isFinite(mm)) return null;
      return { key: m.key, label: m.label, mm };
    })
    .filter((x): x is { key: PlicoKey; label: string; mm: number } => !!x);

  if (!raw.length) return [];

  const max = Math.max(...raw.map(r => r.mm), 1);

  return raw
    .map(r => ({ ...r, pct: Math.round((r.mm / max) * 100) }))
    .sort((a, b) => b.mm - a.mm);
}


  ngOnInit(): void {
    if (this.clienteId) {
      this.loadPage(0);
      this.startCreate(false); // prepara valori ma NON apre il form
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    // se ho già una selected (caso: dati arrivano prima del canvas), disegno
    if (this.selected) {
      setTimeout(() => this.renderPieFromSelected(), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.loadPage(0);
      this.startCreate(false);
    }

    // ✅ se cambia darkmode, aggiorna stile chart senza reload
    if (changes['isDarkMode'] && !changes['isDarkMode'].firstChange) {
      setTimeout(() => this.renderPieFromSelected(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  isEditing(): boolean {
    return this.editingId !== null;
  }

  loadPage(pageIndex: number) {
    if (!this.clienteId) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.api
      .allByCliente(this.clienteId, pageIndex, this.dimensionePagina)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges(); // ✅ forza il DOM a renderizzare il canvas
          setTimeout(() => this.renderPieFromSelected(), 0);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.page = res;
          this.numeroPagina = res.numeroPagina;

          // ✅ seleziona ultima misurazione
          this.selected = res.contenuto?.[0] ?? null;

          this.cdr.markForCheck();
        },
        error: (err) => console.error(err),
      });
  }

  prevPage() {
    if (!this.page) return;
    if (this.page.numeroPagina <= 0) return;
    this.loadPage(this.page.numeroPagina - 1);
  }

  nextPage() {
    if (!this.page) return;
    if (this.page.ultima) return;
    this.loadPage(this.page.numeroPagina + 1);
  }

  view(p: PlicometriaDto) {
  this.selected = p;

  // aggiorna il grafico subito
  setTimeout(() => this.renderPieFromSelected(), 0);
}


  // ===== FORM =====
  startCreate(openForm = true) {
    this.editingId = null;
    this.showForm = openForm;

    this.form.reset({
      metodo: null,
      dataMisurazione: this.todayIso(),
      tricipite: null,
      bicipite: null,
      sottoscapolare: null,
      sovrailiaca: null,
      addominale: null,
      coscia: null,
      pettorale: null,
      ascellare: null,
      polpaccio: null,
      note: null,
    });

    this.cdr.markForCheck();
  }

  startEdit(p: PlicometriaDto) {
    this.editingId = p.id;
    this.showForm = true;

    this.form.reset({
      metodo: p.metodo as MetodoValue,
      dataMisurazione: (p.dataMisurazione ?? this.todayIso()) as any,

      tricipite: p.tricipite ?? null,
      bicipite: p.bicipite ?? null,
      sottoscapolare: p.sottoscapolare ?? null,
      sovrailiaca: p.sovrailiaca ?? null,
      addominale: p.addominale ?? null,
      coscia: p.coscia ?? null,
      pettorale: p.pettorale ?? null,
      ascellare: p.ascellare ?? null,
      polpaccio: p.polpaccio ?? null,

      note: p.note ?? null,
    });

    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.showForm = false;
    this.startCreate(false);
  }

  save() {
    if (!this.clienteId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const payload: PlicometriaFormDto = {
      id: this.editingId ?? undefined,
      cliente: { id: this.clienteId } as any,
      metodo: v.metodo as any,
      dataMisurazione: v.dataMisurazione as any,

      tricipite: v.tricipite ?? undefined,
      bicipite: v.bicipite ?? undefined,
      sottoscapolare: v.sottoscapolare ?? undefined,
      sovrailiaca: v.sovrailiaca ?? undefined,
      addominale: v.addominale ?? undefined,
      coscia: v.coscia ?? undefined,
      pettorale: v.pettorale ?? undefined,
      ascellare: v.ascellare ?? undefined,
      polpaccio: v.polpaccio ?? undefined,

      note: v.note ?? undefined,
    };

    this.saving = true;
    this.cdr.markForCheck();

    const req$ = this.isEditing() ? this.api.update(payload) : this.api.create(payload);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          const pageToReload = this.isEditing() ? (this.page?.numeroPagina ?? 0) : 0;
          this.loadPage(pageToReload);

          this.showForm = false;
          this.startCreate(false);
        },
        error: (err) => console.error(err),
      });
  }

  delete(p: PlicometriaDto) {
    if (!p?.id) return;

    const ok = confirm('Vuoi eliminare questa plicometria?');
    if (!ok) return;

    this.api
      .delete(p.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadPage(this.page?.numeroPagina ?? 0),
        error: (err) => console.error(err),
      });
  }

  // ===== VISIBILITÀ CAMPI =====
  show(field: string): boolean {
    const metodo = this.form.controls.metodo.value as MetodoValue | null;
    if (!metodo) return false;

    if (metodo === 'PARILLO' || metodo === 'MISURAZIONE_LIBERA') return false;

    if (metodo === 'DURNIN_WOMERSLEY') {
      return ['tricipite', 'bicipite', 'sottoscapolare', 'sovrailiaca'].includes(field);
    }

    if (metodo === 'JACKSON_POLLOCK_3') {
      return ['pettorale', 'addominale', 'coscia', 'tricipite', 'sovrailiaca'].includes(field);
    }

    if (metodo === 'JACKSON_POLLOCK_7') {
      return [
        'pettorale',
        'ascellare',
        'tricipite',
        'sottoscapolare',
        'addominale',
        'sovrailiaca',
        'coscia',
      ].includes(field);
    }

    return false;
  }

  // ===== Helpers: ultima misurazione + chart =====
  private pickLatest(list: PlicometriaDto[] | null | undefined): PlicometriaDto | null {
    if (!list?.length) return null;

    return [...list].sort((a, b) => {
      const da = new Date(a.dataMisurazione ?? '').getTime();
      const db = new Date(b.dataMisurazione ?? '').getTime();
      return db - da;
    })[0];
  }

  private renderPieFromSelected(): void {
    if (!this.viewReady) return;

    const canvas = this.plicoPie?.nativeElement;
    if (!canvas) return;

    if (this.chart && this.chart.canvas !== canvas) {
      this.chart.destroy();
      this.chart = undefined;
    }

    const mg = this.selected?.massaGrassaKg ?? 0;
    const mm = this.selected?.massaMagraKg ?? 0;

    // ✅ dark mode
    const legendColor = this.isDarkMode ? '#cbd5e1' : '#334155';
    const tooltipBg = this.isDarkMode ? '#0b1220' : '#ffffff';
    const tooltipText = this.isDarkMode ? '#e5e7eb' : '#0f172a';
    const tooltipBorder = this.isDarkMode
      ? 'rgba(148,163,184,0.18)'
      : 'rgba(15,23,42,0.10)';

    const data = {
      labels: ['Massa Grassa (kg)', 'Massa Magra (kg)'],
      datasets: [
        {
          data: [mg, mm],
          backgroundColor: [
            'rgba(239, 68, 68, 0.55)',
            'rgba(16, 185, 129, 0.55)',
          ],
          borderColor: [
            'rgba(239, 68, 68, 0.95)',
            'rgba(16, 185, 129, 0.95)',
          ],
          borderWidth: 1.5,
        },
      ],
    };

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: legendColor,
            font: { weight: '900' },
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipText,
          borderColor: tooltipBorder,
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.parsed ?? 0;
              return `${ctx.label}: ${Number(v).toFixed(1)} kg`;
            },
          },
        },
      },
    };

    if (!this.chart) {
      this.chart = new Chart(canvas, { type: 'pie', data: data as any, options });
    } else {
      this.chart.data = data as any;
      this.chart.options = options;
      this.chart.update();
    }
  }

  private todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onBackdrop(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) this.cancelEdit();
  }
}
