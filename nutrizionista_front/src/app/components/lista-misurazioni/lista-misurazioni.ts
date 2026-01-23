import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';

import {
  MisurazioneAntropometricaDto,
  PageIt
} from '../../dto/misurazione-antropometrica.dto';

import { MisurazioneAntropometricaService } from '../../services/misurazione-antropometrica.service';

@Component({
  selector: 'app-lista-misurazioni',
  standalone: true,
  imports: [CommonModule],
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.currentPage = 0;
      this.loadMisurazioni();
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

        
        this.page$
          ?.pipe()
          .subscribe(); 

        
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

  trackById = (_: number, item: MisurazioneAntropometricaDto) => item.id;
}
