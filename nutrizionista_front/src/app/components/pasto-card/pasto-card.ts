import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faSun, faMoon, faMugHot, faAppleWhole, faUtensils,
  faChevronRight, faChevronDown, faPlus
} from '@fortawesome/free-solid-svg-icons';
import { PastoDto } from '../../dto/pasto.dto';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';
import { AlimentoAggiunto } from '../alimento-aggiunto/alimento-aggiunto';
import { ListaAlternative, AlternativeProposal } from '../lista-alternative/lista-alternative';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';

@Component({
  selector: 'app-pasto-card',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, AlimentoAggiunto, ListaAlternative],
  templateUrl: './pasto-card.html',
  styleUrl: './pasto-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PastoCard {
  @Input() pasto!: PastoDto;
  @Input() isExpanded = false;
  @Input() isDarkMode = false;
  @Input() alternativesByAlimentoPasto: Record<number, (AlternativeProposal | null)[]> = {};
  @Input() showAddButton = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() orariSaved = new EventEmitter<{ orarioInizio: string; orarioFine: string }>();
  @Output() alimentoAdded = new EventEmitter<void>();
  @Output() alimentoRemoved = new EventEmitter<number>();
  @Output() quantitaChanged = new EventEmitter<{ alimentoId: number; quantita: number }>();
  @Output() alternativeSelected = new EventEmitter<{ alimentoPastoId: number; alimento: AlimentoBaseDto; quantita: number; slot: number }>();
  @Output() alternativeRemoved = new EventEmitter<{ alimentoPastoId: number; index: number; savedId?: number }>();
  @Output() alternativeQuantitaChanged = new EventEmitter<{ alimentoPastoId: number; slot: number; quantita: number }>();
  @Output() alternativeModeChanged = new EventEmitter<{ alimentoPastoId: number; slot: number; mode: MacroType }>();

  readonly icons = {
    chevronRight: faChevronRight,
    chevronDown: faChevronDown,
    plus: faPlus
  };

  private readonly pastoIcons: Record<string, IconDefinition> = {
    'Colazione': faMugHot,
    'Pranzo': faSun,
    'Cena': faMoon,
    'Spuntino': faAppleWhole
  };

  get icon(): IconDefinition {
    return this.pastoIcons[this.pasto?.nome] || faUtensils;
  }

  get orarioDisplay(): string {
    if (this.pasto?.orarioInizio && this.pasto?.orarioFine) {
      return `${this.pasto.orarioInizio.slice(0, 5)} - ${this.pasto.orarioFine.slice(0, 5)}`;
    }
    return 'Orario non impostato';
  }

  get totaleCalorico(): number {
    if (!this.pasto?.alimentiPasto) return 0;
    return this.pasto.alimentiPasto.reduce((sum, ap) => {
      const cal = ap.alimento?.macroNutrienti?.calorie || 0;
      return sum + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
    }, 0);
  }

  getAlternatives(alimentoPastoId: number): (AlternativeProposal | null)[] {
    return this.alternativesByAlimentoPasto[alimentoPastoId] || [];
  }

  onToggle(): void {
    this.toggle.emit();
  }

  onAddAlimento(): void {
    this.alimentoAdded.emit();
  }

  onRemoveAlimento(alimentoId: number): void {
    this.alimentoRemoved.emit(alimentoId);
  }

  onQuantitaChange(alimentoId: number, quantita: number): void {
    this.quantitaChanged.emit({ alimentoId, quantita });
  }

  onAlternativeSelected(alimentoPastoId: number, event: { alimento: AlimentoBaseDto; quantita: number; slot: number }): void {
    this.alternativeSelected.emit({ alimentoPastoId, ...event });
  }

  onAlternativeRemoved(alimentoPastoId: number, event: { index: number; savedId?: number }): void {
    this.alternativeRemoved.emit({ alimentoPastoId, ...event });
  }

  onAlternativeQuantitaChanged(alimentoPastoId: number, event: { slot: number; quantita: number }): void {
    this.alternativeQuantitaChanged.emit({ alimentoPastoId, ...event });
  }

  onAlternativeModeChanged(alimentoPastoId: number, event: { slot: number; mode: MacroType }): void {
    this.alternativeModeChanged.emit({ alimentoPastoId, ...event });
  }
}
