import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core'; // <--- FIX 1
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBook, faFloppyDisk, faUtensils, faSun, faMoon, faMugHot,
  faAppleWhole, faTrash, faChevronRight, faChevronDown, faMagnifyingGlass,
  faPlus, faArrowRight, faTriangleExclamation, faChartPie, faDumbbell,
  faWheatAlt, faDroplet, faFire
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto } from '../../dto/pasto.dto';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoPastoDto, AlimentoPastoRequest } from '../../dto/alimento-pasto.dto';

import { SchedaService } from '../../services/scheda-service';
import { AlimentoService } from '../../services/alimento-service';
import { PastoService } from '../../services/pasto-service';
import { AlimentoPastoService } from '../../services/alimento-pasto-service';

type MacroType = 'proteine' | 'carboidrati' | 'grassi';

@Component({
  selector: 'app-scheda-dieta',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './scheda-dieta.html',
  styleUrls: ['./scheda-dieta.css']
})
export class SchedaDietaComponent implements OnInit, OnChanges {
  @Input() clienteId!: number;
  @Input() schedaId?: number;
  @Input() isDarkMode = false;

  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); // <--- FIX 2: Iniettiamo CDR
  private schedaService = inject(SchedaService);
  private alimentoService = inject(AlimentoService);
  private alimentoPastoService = inject(AlimentoPastoService);
  private pastoService = inject(PastoService);

  loading = false;
  saving = false;
  loadingAlimenti = false;
  errorMessage = '';
  successMessage = '';

  scheda?: SchedaDto;
  pasti: PastoDto[] = [];
  pastoEspanso?: string;

  searchQuery = '';
  alimentiDisponibili: AlimentoBaseDto[] = [];

  protected readonly icons = {
    book: faBook, save: faFloppyDisk, utensils: faUtensils, sun: faSun, moon: faMoon,
    coffee: faMugHot, apple: faAppleWhole, trash: faTrash, chevronRight: faChevronRight,
    chevronDown: faChevronDown, search: faMagnifyingGlass, plus: faPlus, arrowRight: faArrowRight,
    warning: faTriangleExclamation, chart: faChartPie, dumbbell: faDumbbell,
    wheat: faWheatAlt, droplet: faDroplet, fire: faFire
  };

  ngOnInit(): void {
    const routeClienteId = this.route.snapshot.paramMap.get('clienteId');
    if (routeClienteId && !this.clienteId) {
      this.clienteId = Number(routeClienteId);
    }
    if (this.schedaId) {
      this.loadScheda();
    } else {
      this.initializePastiVuoti();
    }
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
  }

  // --- CARICAMENTO DATI ---

  loadScheda(): void {
    if (!this.schedaId) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Mostra subito spinner

    this.schedaService.getById(this.schedaId).subscribe({
      next: (scheda) => {
        this.scheda = scheda;
        if (scheda.pasti && scheda.pasti.length > 0) {
          this.pasti = scheda.pasti;
        } else {
          this.initializePastiVuoti();
        }
        this.loading = false;
        this.cdr.detectChanges(); // <--- FIX 3: Rimuove spinner
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento della scheda';
        this.loading = false;
        this.cdr.detectChanges(); // <--- FIX 4: Rimuove spinner anche in errore
      }
    });
  }

  private initializePastiVuoti(): void {
    const mealTypes = ['Colazione', 'Pranzo', 'Merenda', 'Cena'] as const;
    this.pasti = mealTypes.map((nome) => ({
      id: -1,
      nome: nome,
      alimentiPasto: [],
      orarioInizio: this.getDefaultOrario(nome, 'inizio'),
      orarioFine: this.getDefaultOrario(nome, 'fine')
    }));
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

  // --- UI HELPERS ---
  togglePasto(nome: string): void {
    this.pastoEspanso = this.pastoEspanso === nome ? undefined : nome;
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

  // --- RICERCA ALIMENTI ---
  onSearchAlimenti(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query || query.length < 2) {
      this.alimentiDisponibili = [];
      return;
    }
    this.loadingAlimenti = true;
    this.alimentoService.search(query).subscribe({
      next: (alimenti) => {
        this.alimentiDisponibili = alimenti;
        this.loadingAlimenti = false;
        this.cdr.detectChanges(); // Aggiorna lista
      },
      error: () => {
        this.loadingAlimenti = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- AZIONI ALIMENTI (AGGIUNGI, RIMUOVI, MODIFICA) ---

  onAggiungiAlimento(alimento: AlimentoBaseDto, forzaInserimento: boolean = false): void {
    if (!alimento.id) return;
    if (!this.pastoEspanso) {
      this.showError('Seleziona prima un pasto cliccando sulla freccia.');
      return;
    }
    const pasto = this.pasti.find(p => p.nome === this.pastoEspanso);
    if (!pasto || !pasto.id || pasto.id === -1) {
      this.showError('Devi prima salvare la scheda per creare i pasti nel database.');
      return;
    }

    const req: AlimentoPastoRequest = {
      pasto: { id: pasto.id },
      alimento: { id: alimento.id },
      quantita: 100,
      forzaInserimento: forzaInserimento
    };

    this.loading = true; // Spinner globale (o locale se preferisci)
    this.cdr.detectChanges();

    this.alimentoPastoService.associa(req).subscribe({
      next: (pastoAggiornato) => {
        const index = this.pasti.findIndex(p => p.id === pasto.id);
        if (index !== -1) this.pasti[index] = pastoAggiornato;
        this.showSuccess(`${alimento.nome} aggiunto!`);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Errore generico';
        if (errorMsg.includes('WARNING_RESTRIZIONE')) {
          if (confirm(errorMsg + "\nVuoi procedere comunque?")) {
            this.onAggiungiAlimento(alimento, true);
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
        const index = this.pasti.findIndex(p => p.id === pasto.id);
        if (index !== -1) this.pasti[index] = pastoAggiornato;
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
    const req: AlimentoPastoRequest = {
      pasto: { id: pasto.id },
      alimento: { id: alimentoId },
      quantita: nuovaQuantita
    };
    this.alimentoPastoService.updateQuantita(req).subscribe({
      next: (pastoAggiornato) => {
        const index = this.pasti.findIndex(p => p.id === pasto.id);
        if (index !== -1) this.pasti[index] = pastoAggiornato;
        this.cdr.detectChanges(); // Aggiorna totali
      },
      error: (err) => console.error(err)
    });
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

  // --- CALCOLI (Invariati) ---
  calcolaMacro(ap: AlimentoPastoDto, macro: MacroType): number {
    const macros = ap.alimento?.macroNutrienti;
    if (!macros) return 0;
    return Math.round(((macros as any)[macro] || 0) * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
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

  // --- SALVATAGGIO ---
  onSalvaScheda(): void {
    if (!this.schedaId) return;
    this.saving = true;
    // Qui andrebbe la logica reale se devi salvare la scheda intera
    setTimeout(() => {
      this.saving = false;
      this.showSuccess('Scheda salvata!');
      this.cdr.detectChanges();
    }, 800);
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
}