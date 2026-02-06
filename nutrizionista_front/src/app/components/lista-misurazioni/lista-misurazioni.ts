import { Component, Input, OnChanges, SimpleChanges, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faTrash,
  faChevronRight,
  faChevronDown,
  faXmark,
  faRulerCombined,
  faPerson,
  faPersonWalking,
  faDumbbell,
  faCalendarDays,
  faClock,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';

import {
  MisurazioneAntropometricaDto,
  PageIt
} from '../../dto/misurazione-antropometrica.dto';

import { MisurazioneAntropometricaService } from '../../services/misurazione-antropometrica.service';

// ✅ Chart.js
import { Chart } from 'chart.js/auto';

type PreviewMetric = { label: string; value?: number | null; unit: string };
type MetricKey = 'all' | 'vita' | 'fianchi' | 'torace' | 'spalle';

@Component({
  selector: 'app-lista-misurazioni',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './lista-misurazioni.html',
  styleUrls: ['./lista-misurazioni.css']
})
export class ListaMisurazioniComponent implements OnChanges, AfterViewInit {
  @Input() clienteId!: number;
  @Input() isDarkMode = false;

  private misurazioneService = inject(MisurazioneAntropometricaService);

  loading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;

  page$!: Observable<PageIt<MisurazioneAntropometricaDto>>;

  misurazioneSelezionata?: MisurazioneAntropometricaDto;

  // ===== Font Awesome icons =====
  icClock: IconDefinition = faClock;
  icCalendar: IconDefinition = faCalendarDays;
  icTrash: IconDefinition = faTrash;
  icChevronRight: IconDefinition = faChevronRight;
  icChevronDown: IconDefinition = faChevronDown;
  icClose: IconDefinition = faXmark;
  icChevronLeft: IconDefinition = faChevronLeft;

  icRuler: IconDefinition = faRulerCombined;
  icTorso: IconDefinition = faPerson;
  icLegs: IconDefinition = faPersonWalking;
  icArms: IconDefinition = faDumbbell;

  // ===== Chart state =====
  @ViewChild('progressChart') progressChart?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;
  chartHasData = false;

  // ✅ default: tutte metriche appena entro
  selectedMetric: MetricKey = 'all';

  // ✅ cache lista corrente (per cambiare tab senza reload)
  private lastList: MisurazioneAntropometricaDto[] = [];
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    // se ho già dati in cache (caso raro), disegno
    if (this.lastList.length) {
      setTimeout(() => this.updateChartFromList(this.lastList), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.currentPage = 0;
      this.misurazioneSelezionata = undefined;
      this.loadMisurazioni();
    }

    // se cambia darkmode, aggiorna stile chart senza reload
    if (changes['isDarkMode'] && !changes['isDarkMode'].firstChange) {
      this.updateChartFromList(this.lastList);
    }
  }

  loadMisurazioni(): void {
    if (!this.clienteId) return;

    this.loading = true;
    this.errorMessage = '';

    this.page$ = this.misurazioneService
      .getAllByCliente(this.clienteId, this.currentPage, this.pageSize)
      .pipe(
        tap((page) => {
          this.lastList = page.contenuto ?? [];
          // chart update
          setTimeout(() => this.updateChartFromList(this.lastList), 0);
        }),
        catchError((err) => {
          console.error(err);
          this.errorMessage = 'Errore nel caricamento delle misurazioni';
          this.lastList = [];
          setTimeout(() => this.updateChartFromList([]), 0);

          return of({
            contenuto: [],
            numeroPagina: this.currentPage,
            dimensionePagina: this.pageSize,
            totaleElementi: 0,
            totalePagine: 0,
            ultima: true
          } satisfies PageIt<MisurazioneAntropometricaDto>);
        }),
        finalize(() => {
          this.loading = false;
        }),
        shareReplay(1)
      );
  }

  goToPage(page: number): void {
    if (page < 0) return;
    this.currentPage = page;
    this.loadMisurazioni();
  }

  onSelezionaMisurazione(m: MisurazioneAntropometricaDto): void {
    this.misurazioneSelezionata =
      this.misurazioneSelezionata?.id === m.id ? undefined : m;
  }

  onChiudiDettaglio(): void {
    this.misurazioneSelezionata = undefined;
  }

  onEliminaMisurazione(m: MisurazioneAntropometricaDto, event: Event): void {
    event.stopPropagation();

    if (!confirm('Sei sicuro di voler eliminare questa misurazione?')) return;
    if (!m.id) return;

    this.misurazioneService.delete(m.id).subscribe({
      next: () => {
        if (this.misurazioneSelezionata?.id === m.id) {
          this.misurazioneSelezionata = undefined;
        }
        this.loadMisurazioni(); // ✅ ricarica e aggiorna grafico
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Errore durante l'eliminazione della misurazione";
      }
    });
  }

  // ✅ cambio tab: NON reload, aggiorno dal cache
  selectMetric(metric: MetricKey): void {
    this.selectedMetric = metric;
    this.updateChartFromList(this.lastList);
  }

  formatData(data?: string): string {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  hasValues(m: MisurazioneAntropometricaDto): boolean {
    return !!(
      m.spalle ||
      m.vita ||
      m.fianchi ||
      m.torace ||
      m.gambaS ||
      m.gambaD ||
      m.bicipiteS ||
      m.bicipiteD
    );
  }

  getPreviewMetrics(m: MisurazioneAntropometricaDto): PreviewMetric[] {
    return [
      { label: 'Vita', value: m.vita ?? null, unit: 'cm' },
      { label: 'Fianchi', value: m.fianchi ?? null, unit: 'cm' },
      { label: 'Torace', value: m.torace ?? null, unit: 'cm' }
    ];
  }

  getCompletion(m: MisurazioneAntropometricaDto): { filled: number; total: number; pct: number } {
    const fields: Array<number | undefined | null> = [
      m.spalle, m.torace, m.vita, m.fianchi,
      m.gambaS, m.gambaD, m.bicipiteS, m.bicipiteD
    ];
    const filled = fields.filter(v => v !== null && v !== undefined && v !== 0).length;
    const total = fields.length;
    const pct = total ? Math.round((filled / total) * 100) : 0;
    return { filled, total, pct };
  }

  // =========================
  // CHART HELPERS
  // =========================
  private metricLabel(metric: Exclude<MetricKey, 'all'>): string {
    switch (metric) {
      case 'vita': return 'Vita';
      case 'fianchi': return 'Fianchi';
      case 'torace': return 'Torace';
      case 'spalle': return 'Spalle';
    }
  }

  private getMetricValue(m: MisurazioneAntropometricaDto, metric: Exclude<MetricKey, 'all'>): number | null {
    const v =
      metric === 'vita' ? m.vita :
      metric === 'fianchi' ? m.fianchi :
      metric === 'torace' ? m.torace :
      m.spalle;

    return (v === null || v === undefined || v === 0) ? null : v;
  }

  private updateChartFromList(list: MisurazioneAntropometricaDto[]) {
    // se la view non è pronta, evita errori (es. canvas non esiste ancora)
    if (!this.viewReady) return;

    const sorted = [...list].sort((a, b) =>
      new Date(a.dataMisurazione || '').getTime() - new Date(b.dataMisurazione || '').getTime()
    );

    const labels = sorted.map(x => this.formatData(x.dataMisurazione));

    // palette per metrica (colori diversi)
    const palette: Record<Exclude<MetricKey, 'all'>, { border: string; point: string }> = {
      vita: { border: '#10b981', point: '#10b981' },      // green
      fianchi: { border: '#3b82f6', point: '#3b82f6' },   // blue
      torace: { border: '#f59e0b', point: '#f59e0b' },    // amber
      spalle: { border: '#a855f7', point: '#a855f7' }    // purple
    };

    const buildSeries = (metric: Exclude<MetricKey, 'all'>) => {
      const values = sorted.map(x => this.getMetricValue(x, metric));
      return { metric, values };
    };

    const allSeries = [
      buildSeries('vita'),
      buildSeries('fianchi'),
      buildSeries('torace'),
      buildSeries('spalle')
    ];

    const activeSeries =
      this.selectedMetric === 'all'
        ? allSeries
        : [buildSeries(this.selectedMetric as Exclude<MetricKey, 'all'>)];

    const hasAny = activeSeries.some(s => s.values.some(v => v !== null && v !== undefined));
    this.chartHasData = hasAny && labels.length > 0;

    if (!this.chartHasData) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = undefined;
      }
      return;
    }

    const canvas = this.progressChart?.nativeElement;
    if (!canvas) return;

    const gridColor = this.isDarkMode ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)';
    const tickColor = this.isDarkMode ? '#cbd5e1' : '#334155';
    const isSinglePoint = labels.length === 1;

    const datasets = activeSeries.map(s => {
      const c = palette[s.metric];
      return {
        label: this.metricLabel(s.metric),
        data: s.values.map(v => (v ?? null)),
        spanGaps: true,
        tension: 0.35,
        borderWidth: 2,
        borderColor: c.border,
        pointBackgroundColor: c.point,
        pointBorderColor: c.point,
        pointRadius: isSinglePoint ? 6 : 3, // ✅ visibile anche con 1 misurazione
        pointHoverRadius: 7
      };
    });

    const data = { labels, datasets };

    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.parsed.y;
              return v == null ? `${ctx.dataset.label}: —` : `${ctx.dataset.label}: ${v} cm`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, maxRotation: 0 } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: false }
      }
    };

    if (!this.chart) {
      this.chart = new Chart(canvas, { type: 'line', data: data as any, options });
    } else {
      this.chart.data = data as any;
      this.chart.options = options;
      this.chart.update();
    }
  }

  trackById = (_: number, item: MisurazioneAntropometricaDto) => item.id;
}
