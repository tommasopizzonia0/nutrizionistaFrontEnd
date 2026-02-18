import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEdit, faTimes, faCalendarDays, faCheckCircle, faBan,
  faUtensils, faFire, faClipboardList, faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto } from '../../dto/pasto.dto';
import { Chart } from 'chart.js/auto';
import { computeMacroPercentages, computeNutritionTotalsFromPasti, formatThousands, NutritionPercentages, NutritionTotals } from './nutrition-metrics';
import { SchedaCacheService } from '../../services/scheda-cache.service';
import { SchedaService } from '../../services/scheda-service';

@Component({
  selector: 'app-anteprima-scheda',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './anteprima-scheda.html',
  styleUrls: ['./anteprima-scheda.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnteprimaSchedaComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() scheda!: SchedaDto;
  @Input() isDarkMode = false;
  @Output() editRequested = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();
  @Output() activated = new EventEmitter<SchedaDto>();

  @ViewChild('macroDonutChart') macroDonutChart?: ElementRef<HTMLCanvasElement>;

  private schedaCache = inject(SchedaCacheService);
  private schedaService = inject(SchedaService);
  private cdr = inject(ChangeDetectorRef);

  // La scheda con dati completi (pasti + alimentiPasto)
  schedaDettagliata?: SchedaDto;
  loading = false;
  fromCache = false;
  activating = false;
  nutritionTotals: NutritionTotals = { kcal: 0, proteineG: 0, carboidratiG: 0, grassiG: 0 };
  nutritionPct: NutritionPercentages = { proteinePct: 0, carboidratiPct: 0, grassiPct: 0 };
  macroChartHasData = false;


  // Icone
  icEdit = faEdit;
  icClose = faTimes;
  icCalendar = faCalendarDays;
  icCheck = faCheckCircle;
  icBan = faBan;
  icUtensils = faUtensils;
  icFire = faFire;
  icClipboard = faClipboardList;
  icSpinner = faSpinner;

  private macroChart?: Chart;
  private currentSchedaId?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scheda'] && this.scheda?.id) {
      this.currentSchedaId = this.scheda.id;
      this.loadSchedaDettagliata(this.scheda.id);
    }
    if (changes['isDarkMode']) {
      this.updateMacroChart();
    }
  }

  private loadSchedaDettagliata(id: number): void {
    this.fromCache = this.schedaCache.isCached(id);
    this.loading = !this.fromCache;
    this.cdr.markForCheck();

    this.schedaCache.getByIdCached(id).subscribe({
      next: ({ scheda, fromCache }) => {
        if (this.currentSchedaId !== id) return;
        this.fromCache = fromCache;
        this.schedaDettagliata = scheda;
        this.refreshNutrition();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        if (this.currentSchedaId !== id) return;
        this.fromCache = false;
        this.schedaDettagliata = this.scheda;
        this.refreshNutrition();
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    this.updateMacroChart();
  }

  ngOnDestroy(): void {
    if (this.macroChart) {
      this.macroChart.destroy();
      this.macroChart = undefined;
    }
  }

  onEdit(): void {
    this.editRequested.emit();
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  onActivate(): void {
    const id = this.schedaDettagliata?.id ?? this.scheda?.id;
    if (!id) return;
    if (this.schedaDettagliata?.attiva ?? this.scheda?.attiva) return;
    if (this.activating) return;

    this.activating = true;
    this.cdr.markForCheck();

    this.schedaService.activate(id).subscribe({
      next: (updated) => {
        this.schedaCache.clear();
        this.schedaDettagliata = updated;
        this.scheda = { ...(this.scheda as any), attiva: updated.attiva } as any;
        this.refreshNutrition();
        this.activating = false;
        this.cdr.markForCheck();
        this.activated.emit(updated);
      },
      error: () => {
        this.schedaCache.invalidate(id);
        this.activating = false;
        this.cdr.markForCheck();
        alert('Impossibile attivare la dieta');
      }
    });
  }

  calcolaTotaleCalorico(pasto: PastoDto): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => {
      const cal = ap.alimento?.macroNutrienti?.calorie || 0;
      return sum + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
    }, 0);
  }

  calcolaTotaleCalorieGiornaliere(): number {
    if (!this.schedaDettagliata?.pasti) return 0;
    return this.schedaDettagliata.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleCalorico(pasto), 0);
  }

  calcolaPercentualeCaloriePasto(pasto: PastoDto): number {
    const total = this.nutritionTotals.kcal || this.calcolaTotaleCalorieGiornaliere();
    if (total <= 0) return 0;
    const v = (this.calcolaTotaleCalorico(pasto) / total) * 100;
    return Math.max(0, Math.min(100, Number(v.toFixed(2))));
  }

  formatKcal(value: number): string {
    return formatThousands(value, 'it-IT');
  }

  kcalBarPercent(value: number): number {
    const max = 3000;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  private refreshNutrition(): void {
    const schedaId = this.schedaDettagliata?.id;
    if (!schedaId) return;

    const totals = computeNutritionTotalsFromPasti(this.schedaDettagliata?.pasti);
    const pct = computeMacroPercentages(totals);
    this.nutritionTotals = totals;
    this.nutritionPct = pct;
    this.macroChartHasData = (totals.proteineG + totals.carboidratiG + totals.grassiG) > 0;
    this.updateMacroChart();
  }

  private updateMacroChart(): void {
    const canvas = this.macroDonutChart?.nativeElement;
    if (!canvas) return;

    const colors = ['#3498db', '#e67e22', '#27ae60'];
    const labels = ['Proteine', 'Carboidrati', 'Grassi'];
    const dataG = [this.nutritionTotals.proteineG, this.nutritionTotals.carboidratiG, this.nutritionTotals.grassiG];
    const sum = dataG[0] + dataG[1] + dataG[2];

    const isPlaceholder = sum <= 0;
    const chartData = isPlaceholder ? [1] : dataG;
    const chartLabels = isPlaceholder ? ['Dati non disponibili'] : labels;
    const chartColors = isPlaceholder ? ['#cbd5e1'] : colors;

    const textColor = this.isDarkMode ? '#e5e7eb' : '#111827';
    const borderColor = this.isDarkMode ? '#111827' : '#ffffff';

    if (this.macroChart) {
      this.macroChart.data.labels = chartLabels;
      this.macroChart.data.datasets[0].data = chartData as any;
      (this.macroChart.data.datasets[0] as any).backgroundColor = chartColors;
      (this.macroChart.data.datasets[0] as any).borderColor = borderColor;
      const legendLabels: any = (this.macroChart.options?.plugins as any)?.legend?.labels;
      if (legendLabels) legendLabels.color = textColor;
      const tooltipPlugin: any = (this.macroChart.options?.plugins as any)?.tooltip;
      if (tooltipPlugin) tooltipPlugin.enabled = !isPlaceholder;
      this.macroChart.update();
      return;
    }

    this.macroChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartData as any,
            backgroundColor: chartColors,
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
            display: false,
            labels: {
              color: textColor
            }
          },
          tooltip: {
            enabled: !isPlaceholder,
            callbacks: {
              label: (ctx: any) => {
                const label = String(ctx.label || '');
                const value = Number(ctx.raw || 0);
                const pct = sum > 0 ? (value / sum) * 100 : 0;
                const grams = value.toFixed(1).replace('.', ',');
                return `${label}: ${grams} g (${pct.toFixed(1).replace('.', ',')}%)`;
              }
            }
          }
        }
      }
    });
  }
}
