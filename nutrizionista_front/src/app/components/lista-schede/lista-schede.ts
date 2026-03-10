import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTrash, faChevronRight, faChevronLeft, faPlus,
  faUtensils, faCalendarDays, faCheckCircle, faBan, faEdit, faClipboardList, faCalendarWeek
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto, TipoScheda } from '../../dto/scheda.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { SchedaService } from '../../services/scheda-service';
import { SchedaCacheService } from '../../services/scheda-cache.service';

@Component({
  selector: 'app-lista-schede',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './lista-schede.html',
  styleUrls: ['./lista-schede.css']
})
export class ListaSchede implements OnChanges {
  // ... Input, Output e Service injection rimangono uguali ...
  @Input() clienteId!: number;
  @Input() isDarkMode = false;
  @Output() schedaSelected = new EventEmitter<SchedaDto>();
  @Output() schedaPreview = new EventEmitter<SchedaDto>();
  @Output() createNew = new EventEmitter<TipoScheda>();
  @Output() schedaRenamed = new EventEmitter<SchedaDto>();

  private schedaService = inject(SchedaService);
  private schedaCache = inject(SchedaCacheService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  currentPage = 0;
  pageSize = 10;
  schede: SchedaDto[] = [];
  totalePagine = 0;
  totaleElementi = 0;
  page$!: Observable<PageResponse<SchedaDto>>;

  editingSchedaId?: number;
  editNome = '';
  editNomeOriginale = '';
  editError = '';
  savingNome = false;

  // Icone aggiornate per il layout "Tabella"
  icTrash = faTrash;
  icEdit = faEdit; // Aggiunta matita
  icChevronRight = faChevronRight;
  icChevronLeft = faChevronLeft;
  icPlus = faPlus;
  icUtensils = faUtensils;
  icCalendar = faCalendarDays;
  icCheck = faCheckCircle;
  icBan = faBan;
  icClipboardList = faClipboardList;
  icCalendarWeek = faCalendarWeek;

  showTypeSelector = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.currentPage = 0;
      this.loadSchede();
    }
  }

  loadSchede(): void {
    if (!this.clienteId) return;
    this.loading = true;
    this.errorMessage = '';

    this.page$ = this.schedaService
      .getAllByCliente(this.clienteId, this.currentPage, this.pageSize)
      .pipe(
        tap((page) => {
          this.schede = this.sortSchede(page.contenuto);
          this.totalePagine = page.totalePagine;
          this.totaleElementi = page.totaleElementi;
        }),
        catchError((err) => {
          console.error(err);
          this.errorMessage = 'Errore nel caricamento';
          return of({
            contenuto: [],
            numeroPagina: 0, dimensionePagina: 10, totaleElementi: 0, totalePagine: 0, ultima: true
          } as PageResponse<SchedaDto>);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
        shareReplay(1)
      );

    // Subscribe per triggerare il caricamento
    this.page$.subscribe();
  }

  private sortSchede(schede: SchedaDto[]): SchedaDto[] {
    return (schede ?? []).slice().sort((a, b) => {
      const aTime = this.toSortableTime(a?.dataCreazione);
      const bTime = this.toSortableTime(b?.dataCreazione);

      if (aTime !== bTime) return bTime - aTime;
      return (b?.id ?? 0) - (a?.id ?? 0);
    });
  }

  private toSortableTime(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const fallback = Date.parse(`${value}T00:00:00`);
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  // Metodi goToPage, onSelezionaScheda, ecc... rimangono invariati
  goToPage(page: number): void { if (page >= 0) { this.currentPage = page; this.loadSchede(); } }
  onSelezionaScheda(scheda: SchedaDto): void { this.schedaSelected.emit(scheda); }
  onPreviewScheda(scheda: SchedaDto): void { this.schedaPreview.emit(scheda); }
  onCreaNuova(): void { this.createNew.emit('GIORNALIERA'); }

  toggleTypeSelector(event: Event): void {
    event.stopPropagation();
    this.showTypeSelector = !this.showTypeSelector;
  }

  onCreaNuovaConTipo(tipo: TipoScheda): void {
    this.showTypeSelector = false;
    this.createNew.emit(tipo);
  }

  startRename(scheda: SchedaDto, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.savingNome) return;
    if (!scheda?.id) return;

    this.editingSchedaId = scheda.id;
    this.editNomeOriginale = scheda.nome ?? '';
    this.editNome = this.editNomeOriginale;
    this.editError = '';
    this.cdr.detectChanges();

    const elId = `scheda-name-input-${scheda.id}`;
    setTimeout(() => {
      const input = document.getElementById(elId) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 0);
  }

  cancelRename(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.savingNome) return;
    this.editingSchedaId = undefined;
    this.editNome = '';
    this.editNomeOriginale = '';
    this.editError = '';
    this.cdr.detectChanges();
  }

  confirmRename(scheda: SchedaDto, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.savingNome) return;
    if (!scheda?.id) return;

    const trimmed = (this.editNome ?? '').trim();
    const validation = this.validateNome(trimmed);
    if (validation) {
      this.editError = validation;
      this.cdr.detectChanges();
      const input = document.getElementById(`scheda-name-input-${scheda.id}`) as HTMLInputElement | null;
      input?.focus();
      input?.select();
      return;
    }

    if (trimmed === (this.editNomeOriginale ?? '').trim()) {
      this.cancelRename(event);
      return;
    }

    this.savingNome = true;
    this.editError = '';
    this.cdr.detectChanges();

    const clienteId = scheda?.cliente?.id ?? this.clienteId;
    this.schedaService.update({
      id: scheda.id,
      nome: trimmed,
      cliente: { id: clienteId },
      attiva: scheda.attiva,
      dataCreazione: scheda.dataCreazione
    } as any).subscribe({
      next: (updated) => {
        this.savingNome = false;
        this.editingSchedaId = undefined;
        this.schede = (this.schede ?? []).map((s) =>
          s.id === updated.id
            ? { ...s, ...updated, pasti: (updated as any)?.pasti ?? s.pasti }
            : s
        );
        this.schedaCache.invalidate(updated.id);
        this.cdr.detectChanges();
        this.schedaRenamed.emit(updated);
      },
      error: (err) => {
        this.savingNome = false;
        this.editError = err?.error?.message || 'Impossibile salvare il nome';
        this.cdr.detectChanges();
        const input = document.getElementById(`scheda-name-input-${scheda.id}`) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
    });
  }

  isEditing(schedaId: number | undefined): boolean {
    return !!schedaId && this.editingSchedaId === schedaId;
  }

  private validateNome(value: string): string {
    if (!value) return 'Il nome non può essere vuoto';
    if (value.length < 3) return 'Minimo 3 caratteri';
    if (value.length > 50) return 'Massimo 50 caratteri';
    return '';
  }

  onEliminaScheda(scheda: SchedaDto, event: Event): void {
    event.stopPropagation();
    if (!confirm('Eliminare questa scheda?')) return;
    if (!scheda.id) return;
    this.schedaService.delete(scheda.id).subscribe({
      next: () => {
        // Rimuovi dalla lista locale per aggiornamento immediato
        this.schede = this.schede.filter(s => s.id !== scheda.id);
        this.cdr.detectChanges();
        // Ricarica dal server per dati aggiornati
        this.loadSchede();
      },
      error: () => alert('Impossibile eliminare')
    });
  }

  trackById = (_: number, item: SchedaDto) => item.id;
}
