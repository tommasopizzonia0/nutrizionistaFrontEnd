import { Component, Input, Output, EventEmitter, ChangeDetectorRef, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEdit, faXmark, faFire, faDumbbell, faWheatAlt, faDroplet, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoService } from '../../services/alimento-service';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';
type AlternativeMode = MacroType;

export type AlternativeProposal = {
  alimento: AlimentoBaseDto;
  quantita: number;
  mode: AlternativeMode;
  manual: boolean;
  savedId?: number;
  saving?: boolean;
  nomeCustom?: string | null;
  nomeVisualizzato?: string | null;
};

@Component({
  selector: 'app-lista-alternative',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './lista-alternative.html',
  styleUrl: './lista-alternative.css'
})
export class ListaAlternative {
  @Input() alimentoPasto!: AlimentoPastoDto;
  @Input() alternatives: (AlternativeProposal | null)[] = [];
  @Input() defaultMode: AlternativeMode = 'calorie';
  @Input() isDarkMode = false;
  @Input() showMode: 'all' | 'search-only' | 'display-only' = 'all';

  @Output() alternativeSelected = new EventEmitter<{ alimento: AlimentoBaseDto; quantita: number; slot: number }>();
  @Output() alternativeRemoved = new EventEmitter<{ index: number; savedId?: number }>();
  @Output() quantitaChanged = new EventEmitter<{ slot: number; quantita: number }>();
  @Output() modeChanged = new EventEmitter<{ slot: number; mode: AlternativeMode }>();
  @Output() displayNameChange = new EventEmitter<{ alternativaId: number; nome: string | null }>();

  @ViewChild('altNomeInput') altNomeInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);
  private alimentoService = inject(AlimentoService);

  readonly icons = {
    plus: faPlus,
    edit: faEdit,
    pen: faPen,
    confirm: faCheck,
    cancel: faXmark,
    xmark: faXmark,
    fire: faFire,
    dumbbell: faDumbbell,
    wheat: faWheatAlt,
    droplet: faDroplet
  };

  readonly modes: AlternativeMode[] = ['calorie', 'proteine', 'carboidrati', 'grassi'];

  // UI State
  editingSlot: number | null = null;
  searchQuery = '';
  searchLoading = false;
  searchResults: AlimentoBaseDto[] = [];
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  openModeForIndex: number | null = null;
  editingNomeIndex: number | null = null;
  editNomeValue = '';

  get validAlternatives(): { index: number; alt: AlternativeProposal }[] {
    return this.alternatives
      .map((alt, index) => ({ index, alt }))
      .filter((entry): entry is { index: number; alt: AlternativeProposal } => entry.alt !== null);
  }

  get addSlot(): number {
    const idx = this.alternatives.findIndex(a => a === null);
    return idx >= 0 ? idx : this.alternatives.length;
  }

  getModeIcon(mode: AlternativeMode) {
    const icons: Record<AlternativeMode, any> = {
      calorie: this.icons.fire,
      proteine: this.icons.dumbbell,
      carboidrati: this.icons.wheat,
      grassi: this.icons.droplet
    };
    return icons[mode];
  }

  // Search with debounce
  onSearchInput(query: string): void {
    this.searchQuery = query;
    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchLoading = true;
    this.searchTimer = setTimeout(() => {
      this.alimentoService.search(query).subscribe({
        next: (results) => {
          this.searchResults = results.slice(0, 10);
          this.searchLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.searchLoading = false;
          this.cdr.detectChanges();
        }
      });
    }, 300);
  }

  openEditor(slot: number): void {
    this.editingSlot = slot;
    this.searchQuery = '';
    this.searchResults = [];
  }

  closeEditor(): void {
    this.editingSlot = null;
    this.searchQuery = '';
    this.searchResults = [];
  }

  selectAlternative(alimento: AlimentoBaseDto): void {
    if (this.editingSlot === null) return;

    const quantita = this.suggestQuantity(alimento);
    this.alternativeSelected.emit({
      alimento,
      quantita,
      slot: this.editingSlot
    });
    this.closeEditor();
  }

  removeAlternative(index: number, savedId?: number): void {
    this.alternativeRemoved.emit({ index, savedId });
  }

  onQuantitaChange(slot: number, quantita: number): void {
    if (quantita > 0) {
      this.quantitaChanged.emit({ slot, quantita });
    }
  }

  onModeChange(slot: number, mode: AlternativeMode): void {
    this.modeChanged.emit({ slot, mode });
  }

  toggleModeMenu(index: number): void {
    this.openModeForIndex = this.openModeForIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  selectMode(index: number, mode: AlternativeMode): void {
    this.onModeChange(index, mode);
    this.openModeForIndex = null;
  }

  calcolaMacro(alt: AlternativeProposal, macro: MacroType): number {
    const macros = alt.alimento?.macroNutrienti;
    if (!macros) return 0;
    const misura = alt.alimento?.misuraInGrammi || 100;
    const value = (macros as any)[macro] || 0;
    return value * (alt.quantita || 0) / misura;
  }

  getNomeVisualizzato(alt: AlternativeProposal): string {
    return alt.nomeVisualizzato || alt.nomeCustom || alt.alimento?.nome || 'Alternativa';
  }

  startEditNome(index: number, alt: AlternativeProposal): void {
    this.editingNomeIndex = index;
    this.editNomeValue = alt.nomeCustom || alt.alimento?.nome || '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.altNomeInput?.nativeElement?.focus();
      this.altNomeInput?.nativeElement?.select();
    }, 0);
  }

  cancelEditNome(): void {
    this.editingNomeIndex = null;
    this.editNomeValue = '';
    this.cdr.detectChanges();
  }

  confirmEditNome(alt: AlternativeProposal): void {
    if (!alt.savedId) {
      this.cancelEditNome();
      return;
    }
    const nome = this.editNomeValue.trim();
    const catalogo = (alt.alimento?.nome || '').trim();
    this.editingNomeIndex = null;

    if (!nome || nome === catalogo) {
      this.displayNameChange.emit({ alternativaId: alt.savedId, nome: null });
    } else {
      this.displayNameChange.emit({ alternativaId: alt.savedId, nome });
    }
    this.cdr.detectChanges();
  }

  onNomeKeydown(event: KeyboardEvent, alt: AlternativeProposal): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmEditNome(alt);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditNome();
    }
  }

  private suggestQuantity(alimento: AlimentoBaseDto): number {
    // Basic calculation based on calorie equivalence
    const originalCal = this.alimentoPasto?.alimento?.macroNutrienti?.calorie || 100;
    const originalQty = this.alimentoPasto?.quantita || 100;
    const alternativeCal = alimento.macroNutrienti?.calorie || 100;
    const misuraGrammi = alimento.misuraInGrammi || 100;

    const originalTotal = originalCal * originalQty / (this.alimentoPasto?.alimento?.misuraInGrammi || 100);
    return Math.round(originalTotal / alternativeCal * misuraGrammi);
  }
}
