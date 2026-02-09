import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faMagnifyingGlass, faPlus, faArrowRight, faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoService } from '../../services/alimento-service';

@Component({
  selector: 'app-catalogo-alimenti',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './catalogo-alimenti.html',
  styleUrl: './catalogo-alimenti.css',
})
export class CatalogoAlimenti implements OnInit {
  /** Nome del pasto attualmente espanso/selezionato */
  @Input() pastoEspanso?: string;

  /** Indica se la scheda è stata salvata (ha un ID valido) */
  @Input() schedaSalvata = false;

  /** Se true, usa tema scuro */
  @Input() isDarkMode = false;

  /** Emesso quando l'utente clicca su un alimento per aggiungerlo */
  @Output() alimentoSelezionato = new EventEmitter<AlimentoBaseDto>();

  private alimentoService = inject(AlimentoService);
  private cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  alimentiDisponibili: AlimentoBaseDto[] = [];
  loadingAlimenti = false;

  protected readonly icons = {
    search: faMagnifyingGlass,
    plus: faPlus,
    arrowRight: faArrowRight,
    warning: faTriangleExclamation
  };

  ngOnInit(): void {
    // Carica alimenti popolari all'avvio (senza query)
    this.loadAlimentiIniziali();
  }

  /**
   * Carica una lista iniziale di alimenti per mostrare subito il catalogo
   */
  private loadAlimentiIniziali(): void {
    this.loadingAlimenti = true;
    // Cerca una lettera comune per avere risultati
    this.alimentoService.search('a').subscribe({
      next: (alimenti) => {
        // Limita a 10 risultati iniziali
        this.alimentiDisponibili = alimenti.slice(0, 10);
        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Ricerca alimenti - senza limite minimo di caratteri
   */
  onSearchAlimenti(): void {
    const query = this.searchQuery.trim();

    // Se vuoto, mostra alimenti iniziali
    if (!query) {
      this.loadAlimentiIniziali();
      return;
    }

    this.loadingAlimenti = true;
    this.alimentoService.search(query).subscribe({
      next: (alimenti) => {
        this.alimentiDisponibili = alimenti;
        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Gestisce il click su un alimento
   */
  onClickAlimento(alimento: AlimentoBaseDto): void {
    this.alimentoSelezionato.emit(alimento);
  }
}
