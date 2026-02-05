import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faTrash, faChevronRight, faChevronLeft, faPlus,
  faUtensils, faCalendarDays, faCheckCircle, faBan, faEdit, faClipboardList
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { SchedaService } from '../../services/scheda-service';

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
  @Output() createNew = new EventEmitter<void>();

  private schedaService = inject(SchedaService);
  loading = false;
  errorMessage = '';
  currentPage = 0;
  pageSize = 10;
  page$!: Observable<PageResponse<SchedaDto>>;

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
  icClipboardList = faClipboardList; // Aggiunta icona header

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
        catchError((err) => {
          console.error(err);
          this.errorMessage = 'Errore nel caricamento';
          return of({
            contenuto: [],
            numeroPagina: 0, dimensionePagina: 10, totaleElementi: 0, totalePagine: 0, ultima: true
          } as PageResponse<SchedaDto>);
        }),
        finalize(() => this.loading = false),
        shareReplay(1)
      );
  }

  // Metodi goToPage, onSelezionaScheda, ecc... rimangono invariati
  goToPage(page: number): void { if (page >= 0) { this.currentPage = page; this.loadSchede(); } }
  onSelezionaScheda(scheda: SchedaDto): void { this.schedaSelected.emit(scheda); }
  onPreviewScheda(scheda: SchedaDto): void { this.schedaPreview.emit(scheda); }
  onCreaNuova(): void { this.createNew.emit(); }

  onEliminaScheda(scheda: SchedaDto, event: Event): void {
    event.stopPropagation();
    if (!confirm('Eliminare questa scheda?')) return;
    if (!scheda.id) return;
    this.schedaService.delete(scheda.id).subscribe({
      next: () => this.loadSchede(),
      error: () => alert('Impossibile eliminare')
    });
  }

  trackById = (_: number, item: SchedaDto) => item.id;
}