import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faXmark, faFire, faDumbbell, faWheatAlt, faDroplet, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { PastoTemplateAlternativaDto, AlternativeModeDto } from '../../dto/pasto-template.dto';
import { AlimentoService } from '../../services/alimento-service';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';
type AlternativeMode = MacroType;

@Component({
  selector: 'app-lista-alternative-template',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './lista-alternative-template.html',
  styleUrl: './lista-alternative-template.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaAlternativeTemplateComponent implements OnDestroy {
  @Input() mainAlimento!: AlimentoBaseDto;
  @Input() mainQuantita = 100;
  @Input() alternatives: PastoTemplateAlternativaDto[] = [];
  @Input() isDarkMode = false;
  @Input() showMode: 'all' | 'search-only' | 'display-only' = 'all';

  @Output() alternativesChange = new EventEmitter<PastoTemplateAlternativaDto[]>();

  @ViewChild('altNomeInput') altNomeInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);
  private alimentoService = inject(AlimentoService);

  readonly icons = {
    plus: faPlus,
    xmark: faXmark,
    pen: faPen,
    confirm: faCheck,
    fire: faFire,
    dumbbell: faDumbbell,
    wheat: faWheatAlt,
    droplet: faDroplet
  };

  readonly modes: AlternativeMode[] = ['calorie', 'proteine', 'carboidrati', 'grassi'];

  editingSearch = false;
  searchQuery = '';
  searchLoading = false;
  searchResults: AlimentoBaseDto[] = [];
  warningMessage = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;

  openModeForIndex: number | null = null;
  editingNomeIndex: number | null = null;
  editNomeValue = '';

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
  }

  openSearch(): void {
    if (this.showMode === 'display-only') return;
    this.editingSearch = true;
    this.searchQuery = '';
    this.searchResults = [];
    this.searchLoading = false;
    this.warningMessage = '';
    this.cdr.markForCheck();
  }

  closeSearch(): void {
    this.editingSearch = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.searchLoading = false;
    this.warningMessage = '';
    this.cdr.markForCheck();
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (query.length < 2) {
      this.searchResults = [];
      this.searchLoading = false;
      this.warningMessage = '';
      return;
    }

    this.searchLoading = true;
    this.searchTimer = setTimeout(() => {
      this.alimentoService.search(query).subscribe({
        next: (results) => {
          this.searchResults = this.filterSearchResults(results).slice(0, 8);
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

  selectAlternative(alimento: AlimentoBaseDto): void {
    if (this.mainAlimento?.id && alimento?.id === this.mainAlimento.id) {
      this.setWarning('Non puoi selezionare lo stesso alimento come alternativa.');
      return;
    }
    const exists = (this.alternatives || []).some(a => a.alimentoAlternativo?.id === alimento.id);
    if (exists) {
      this.setWarning('Alternativa già presente.');
      return;
    }

    const mode: AlternativeModeDto = 'CALORIE';
    const quantita = this.suggestQuantity(alimento, 'calorie');
    const nextPriorita = (this.alternatives?.length || 0) + 1;

    const created: PastoTemplateAlternativaDto = {
      alimentoAlternativo: { ...alimento },
      quantita,
      priorita: nextPriorita,
      mode,
      manual: false,
      note: null,
      nomeCustom: null,
      nomeVisualizzato: alimento.nome
    };

    const updated = [...(this.alternatives || []), created];
    this.alternativesChange.emit(updated);
    this.closeSearch();
  }

  private filterSearchResults(results: AlimentoBaseDto[]): AlimentoBaseDto[] {
    const baseId = this.mainAlimento?.id;
    const chosen = new Set<number>();
    (this.alternatives || []).forEach(a => {
      if (a?.alimentoAlternativo?.id) chosen.add(a.alimentoAlternativo.id);
    });
    return (results || []).filter(a => {
      const id = a?.id;
      if (!id) return false;
      if (baseId && id === baseId) return false;
      if (chosen.has(id)) return false;
      return true;
    });
  }

  private setWarning(message: string): void {
    this.warningMessage = message;
    if (this.warningTimer) clearTimeout(this.warningTimer);
    this.warningTimer = setTimeout(() => {
      this.warningMessage = '';
      this.cdr.detectChanges();
    }, 2500);
    this.cdr.detectChanges();
  }

  removeAlternative(index: number): void {
    const copy = [...(this.alternatives || [])];
    copy.splice(index, 1);
    for (let i = 0; i < copy.length; i++) {
      copy[i] = { ...copy[i], priorita: i + 1 };
    }
    this.alternativesChange.emit(copy);
  }

  onQuantitaChange(index: number, quantita: number): void {
    if (!Number.isFinite(quantita) || quantita <= 0) return;
    const copy = [...(this.alternatives || [])];
    const target = copy[index];
    if (!target) return;
    copy[index] = { ...target, quantita: Math.max(1, Math.round(quantita)), manual: true };
    this.alternativesChange.emit(copy);
  }

  toggleModeMenu(index: number): void {
    this.openModeForIndex = this.openModeForIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  selectMode(index: number, mode: AlternativeMode): void {
    const copy = [...(this.alternatives || [])];
    const target = copy[index];
    if (!target) return;
    const modeDto = this.toBackendMode(mode);
    let next = { ...target, mode: modeDto };
    if (next.manual === false) {
      const suggested = this.suggestQuantity(next.alimentoAlternativo, mode);
      next = { ...next, quantita: suggested };
    }
    copy[index] = next;
    this.alternativesChange.emit(copy);
    this.openModeForIndex = null;
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

  fromBackendMode(mode?: AlternativeModeDto | null): AlternativeMode {
    switch (mode) {
      case 'PROTEINE':
        return 'proteine';
      case 'CARBOIDRATI':
        return 'carboidrati';
      case 'GRASSI':
        return 'grassi';
      case 'CALORIE':
      default:
        return 'calorie';
    }
  }

  toBackendMode(mode: AlternativeMode): AlternativeModeDto {
    switch (mode) {
      case 'proteine':
        return 'PROTEINE';
      case 'carboidrati':
        return 'CARBOIDRATI';
      case 'grassi':
        return 'GRASSI';
      case 'calorie':
      default:
        return 'CALORIE';
    }
  }

  calcolaMacro(alt: PastoTemplateAlternativaDto, macro: MacroType): number {
    const alimento = alt.alimentoAlternativo;
    const macros = alimento?.macroNutrienti;
    if (!macros) return 0;
    const misura = alimento?.misuraInGrammi || 100;
    const qty = alt.quantita || 0;
    return ((macros as any)[macro] || 0) * qty / misura;
  }

  getNomeVisualizzato(alt: PastoTemplateAlternativaDto): string {
    return alt.nomeCustom || alt.nomeVisualizzato || alt.alimentoAlternativo?.nome || 'Alternativa';
  }

  startEditNome(index: number, alt: PastoTemplateAlternativaDto): void {
    this.editingNomeIndex = index;
    this.editNomeValue = alt.nomeCustom || alt.alimentoAlternativo?.nome || '';
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

  confirmEditNome(index: number): void {
    const copy = [...(this.alternatives || [])];
    const alt = copy[index];
    if (!alt) {
      this.cancelEditNome();
      return;
    }
    const nome = this.editNomeValue.trim();
    const catalogo = (alt.alimentoAlternativo?.nome || '').trim();
    const nomeCustom = (!nome || nome === catalogo) ? null : nome;
    copy[index] = { ...alt, nomeCustom, nomeVisualizzato: nomeCustom || catalogo || alt.nomeVisualizzato || null };
    this.editingNomeIndex = null;
    this.editNomeValue = '';
    this.alternativesChange.emit(copy);
    this.cdr.detectChanges();
  }

  onNomeKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmEditNome(index);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditNome();
    }
  }

  private suggestQuantity(alimentoAlternativo: AlimentoBaseDto, mode: AlternativeMode): number {
    const main = this.mainAlimento;
    const mainMacros = main?.macroNutrienti as any;
    const altMacros = alimentoAlternativo?.macroNutrienti as any;
    if (!mainMacros || !altMacros) return 100;

    const mainMisura = main?.misuraInGrammi || 100;
    const altMisura = alimentoAlternativo?.misuraInGrammi || 100;

    const target = (Number(mainMacros?.[mode] || 0) * (this.mainQuantita || 0)) / mainMisura;
    const altValue = Number(altMacros?.[mode] || 0);
    if (!target || target <= 0) return 100;
    if (!altValue || altValue <= 0) return 100;
    if (!altMisura || altMisura <= 0) return 100;

    const qty = target * altMisura / altValue;
    const rounded = Math.round(qty);
    return Math.max(1, Math.min(rounded, 9999));
  }
}
