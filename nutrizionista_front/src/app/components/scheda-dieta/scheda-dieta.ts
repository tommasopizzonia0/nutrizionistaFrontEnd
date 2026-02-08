import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBook, faFloppyDisk, faUtensils, faSun, faMoon, faMugHot,
  faAppleWhole, faTrash, faChevronRight, faChevronDown,
  faChartPie, faDumbbell, faWheatAlt, faDroplet, faFire,
  faPlus, faEdit, faXmark
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto, PastoFormDto } from '../../dto/pasto.dto';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoPastoDto, AlimentoPastoRequest } from '../../dto/alimento-pasto.dto';

import { SchedaService } from '../../services/scheda-service';
import { PastoService } from '../../services/pasto-service';
import { AlimentoPastoService } from '../../services/alimento-pasto-service';
import { AlimentoService } from '../../services/alimento-service';
import { CatalogoAlimenti } from '../catalogo-alimenti/catalogo-alimenti';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';
type AlternativeMode = MacroType;

type AlternativeProposal = {
  alimento: AlimentoBaseDto;
  quantita: number;
  mode: AlternativeMode;
  manual: boolean;
};

@Component({
  selector: 'app-scheda-dieta',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, CatalogoAlimenti],
  templateUrl: './scheda-dieta.html',
  styleUrls: ['./scheda-dieta.css']
})
export class SchedaDietaComponent implements OnInit, OnChanges {
  @Input() clienteId!: number;
  @Input() schedaId?: number;
  @Input() isDarkMode = false;

  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private schedaService = inject(SchedaService);
  private alimentoPastoService = inject(AlimentoPastoService);
  private pastoService = inject(PastoService);
  private alimentoService = inject(AlimentoService);

  loading = false;
  saving = false;
  loadingAlimenti = false;
  errorMessage = '';
  successMessage = '';

  scheda?: SchedaDto;
  pasti: PastoDto[] = [];
  pastoEspanso?: string;
  autoSaving = false;

  protected readonly icons = {
    book: faBook, save: faFloppyDisk, utensils: faUtensils, sun: faSun, moon: faMoon,
    coffee: faMugHot, apple: faAppleWhole, trash: faTrash, chevronRight: faChevronRight,
    chevronDown: faChevronDown, chart: faChartPie, dumbbell: faDumbbell,
    wheat: faWheatAlt, droplet: faDroplet, fire: faFire,
    plus: faPlus, edit: faEdit, close: faXmark
  };

  readonly alternativeSlots = [0, 1, 2] as const;
  defaultAlternativeMode: AlternativeMode = 'calorie';
  alternativeByAlimentoPastoId: Record<number, (AlternativeProposal | null)[]> = {};
  alternativeUi: Record<string, { editing: boolean; query: string; loading: boolean; results: AlimentoBaseDto[] }> = {};
  private alternativeSearchTimers: Record<string, number> = {};

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
    this.cdr.detectChanges();

    this.schedaService.getById(this.schedaId).subscribe({
      next: (scheda) => {
        this.scheda = scheda;
        // Merge: sempre 4 pasti di default + dati dal server
        this.mergePastiConDefault(scheda.pasti || []);
        this.syncAlternativeState();
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
   */
  private mergePastiConDefault(pastiDalServer: PastoDto[]): void {
    const mealTypes = ['Colazione', 'Pranzo', 'Merenda', 'Cena'] as const;

    this.pasti = mealTypes.map((nome) => {
      // Cerca se questo pasto esiste già nel server
      const pastoDalServer = pastiDalServer.find(p => p.nome === nome);

      if (pastoDalServer) {
        // Usa i dati dal server
        return pastoDalServer;
      } else {
        // Crea pasto vuoto con id = -1 (non ancora salvato)
        return {
          id: -1,
          nome: nome,
          alimentiPasto: [],
          orarioInizio: this.getDefaultOrario(nome, 'inizio'),
          orarioFine: this.getDefaultOrario(nome, 'fine')
        };
      }
    });
    this.syncAlternativeState();
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
    this.syncAlternativeState();
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
    // Semplicemente toggle il pasto espanso
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



  // --- AZIONI ALIMENTI (AGGIUNGI, RIMUOVI, MODIFICA) ---

  onAggiungiAlimento(alimento: AlimentoBaseDto, forzaInserimento: boolean = false): void {
    if (!alimento.id) return;
    if (!this.pastoEspanso) {
      this.showError('Seleziona prima un pasto cliccando sulla freccia.');
      return;
    }
    if (!this.schedaId) {
      this.showError('Errore: schedaId mancante.');
      return;
    }

    const pasto = this.pasti.find(p => p.nome === this.pastoEspanso);
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
            this.pasti[index] = pastoCreato;
          }
          this.syncAlternativeState();
          // Ora aggiungi l'alimento con il pasto appena creato
          this.aggiungiAlimentoAPasto(pastoCreato, alimento, forzaInserimento);
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
      this.aggiungiAlimentoAPasto(pasto, alimento, forzaInserimento);
    }
  }

  /**
   * Aggiunge un alimento a un pasto esistente (con id valido)
   */
  private aggiungiAlimentoAPasto(pasto: PastoDto, alimento: AlimentoBaseDto, forzaInserimento: boolean): void {
    const req: AlimentoPastoRequest = {
      pasto: { id: pasto.id },
      alimento: { id: alimento.id! },
      quantita: 100,
      forzaInserimento: forzaInserimento
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.alimentoPastoService.associa(req).subscribe({
      next: (pastoAggiornato) => {
        const index = this.pasti.findIndex(p => p.id === pasto.id);
        if (index !== -1) this.pasti[index] = pastoAggiornato;
        this.syncAlternativeState();
        this.showSuccess(`${alimento.nome} aggiunto!`);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const errorMsg = err.error?.message || err.error?.error || err.message || 'Errore generico';
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
        this.syncAlternativeState();
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
        this.syncAlternativeState();
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

  calcolaMacroDaAlimento(alimento: AlimentoBaseDto, quantita: number, macro: MacroType): number {
    const macros = alimento?.macroNutrienti;
    if (!macros) return 0;
    return ((macros as any)[macro] || 0) * (quantita || 0) / (alimento?.misuraInGrammi || 100);
  }

  private syncAlternativeState(): void {
    const presentIds = new Set<number>();
    for (const pasto of this.pasti) {
      for (const ap of (pasto.alimentiPasto || [])) {
        if (typeof ap?.id === 'number') presentIds.add(ap.id);
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
      this.ensureAlternativeEntry(id);
      this.recomputeAlternativesForAlimentoPasto(id);
    }
  }

  private ensureAlternativeEntry(alimentoPastoId: number): void {
    if (!this.alternativeByAlimentoPastoId[alimentoPastoId]) {
      this.alternativeByAlimentoPastoId[alimentoPastoId] = [null, null, null];
    } else {
      const arr = this.alternativeByAlimentoPastoId[alimentoPastoId];
      while (arr.length < 3) arr.push(null);
      this.alternativeByAlimentoPastoId[alimentoPastoId] = arr.slice(0, 3);
    }
  }

  private alternativeKey(alimentoPastoId: number, slot: number): string {
    return `${alimentoPastoId}_${slot}`;
  }

  getAlternative(alimentoPastoId: number, slot: number): AlternativeProposal | null {
    this.ensureAlternativeEntry(alimentoPastoId);
    return this.alternativeByAlimentoPastoId[alimentoPastoId]?.[slot] ?? null;
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
  }

  onAlternativeQueryChange(alimentoPasto: AlimentoPastoDto, slot: number, query: string): void {
    const ui = this.getAlternativeUi(alimentoPasto.id, slot);
    ui.query = query;

    const trimmed = (query || '').trim();
    if (!trimmed) {
      ui.loading = false;
      ui.results = [];
      this.cdr.detectChanges();
      return;
    }

    const key = this.alternativeKey(alimentoPasto.id, slot);
    const prev = this.alternativeSearchTimers[key];
    if (prev) window.clearTimeout(prev);

    ui.loading = true;
    this.alternativeSearchTimers[key] = window.setTimeout(() => {
      this.alimentoService.search(trimmed).subscribe({
        next: (results) => {
          ui.results = this.filterAlternativeResults(alimentoPasto, slot, results).slice(0, 8);
          ui.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          ui.loading = false;
          ui.results = [];
          this.cdr.detectChanges();
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
    this.alternativeByAlimentoPastoId[alimentoPasto.id][slot] = {
      alimento,
      quantita: suggested ?? 100,
      mode,
      manual: false
    };
    this.closeAlternativeEdit(alimentoPasto.id, slot);
  }

  removeAlternative(alimentoPastoId: number, slot: number): void {
    this.ensureAlternativeEntry(alimentoPastoId);
    this.alternativeByAlimentoPastoId[alimentoPastoId][slot] = null;
    this.closeAlternativeEdit(alimentoPastoId, slot);
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
  }

  updateAlternativeQuantity(alimentoPastoId: number, slot: number, quantita: number): void {
    const proposal = this.getAlternative(alimentoPastoId, slot);
    if (!proposal) return;
    if (!quantita || quantita <= 0) return;
    this.alternativeByAlimentoPastoId[alimentoPastoId][slot] = {
      ...proposal,
      quantita,
      manual: true
    };
    this.cdr.detectChanges();
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
