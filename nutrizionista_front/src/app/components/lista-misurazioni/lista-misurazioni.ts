import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';

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

type PreviewMetric = { label: string; value?: number | null; unit: string };

@Component({
  selector: 'app-lista-misurazioni',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './lista-misurazioni.html',
  styleUrls: ['./lista-misurazioni.css']
})
export class ListaMisurazioniComponent implements OnChanges {
  @Input() clienteId!: number;
  @Input() isDarkMode = false;
  

  private misurazioneService = inject(MisurazioneAntropometricaService);

  loading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;

  page$!: Observable<PageIt<MisurazioneAntropometricaDto>>;
  

  misurazioneSelezionata?: MisurazioneAntropometricaDto;

  // ===== Font Awesome icons (importate nel TS) =====
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.currentPage = 0;
      this.loadMisurazioni();
      this.misurazioneSelezionata = undefined; // UX: reset selezione cambiando cliente
    }
  }

  loadMisurazioni(): void {
    if (!this.clienteId) return;

    this.loading = true;
    this.errorMessage = '';

    this.page$ = this.misurazioneService
      .getAllByCliente(this.clienteId, this.currentPage, this.pageSize)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.errorMessage = 'Errore nel caricamento delle misurazioni';
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
        this.loadMisurazioni();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Errore durante l'eliminazione della misurazione";
      }
    });
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
  // scegliamo 3 metriche “core” per un nutrizionista
  return [
    { label: 'Vita',   value: m.vita ?? null,   unit: 'cm' },
    { label: 'Fianchi',value: m.fianchi ?? null,unit: 'cm' },
    { label: 'Torace', value: m.torace ?? null, unit: 'cm' },
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
  trackById = (_: number, item: MisurazioneAntropometricaDto) => item.id;
}
