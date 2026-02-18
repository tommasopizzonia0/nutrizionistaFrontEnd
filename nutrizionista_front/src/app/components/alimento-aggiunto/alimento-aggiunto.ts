import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faDumbbell, faWheatAlt, faDroplet, faFire, faPen, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';

@Component({
  selector: 'app-alimento-aggiunto',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './alimento-aggiunto.html',
  styleUrl: './alimento-aggiunto.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlimentoAggiunto {
  @Input() alimentoPasto!: AlimentoPastoDto;
  @Input() isDarkMode = false;

  @Output() quantitaChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();
  @Output() displayNameChange = new EventEmitter<{ alimentoPastoId: number; nome: string | null }>();

  @ViewChild('nomeInput') nomeInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  editingNome = false;
  editNomeValue = '';

  readonly icons = {
    trash: faTrash,
    edit: faPen,
    confirm: faCheck,
    cancel: faXmark,
    dumbbell: faDumbbell,
    wheat: faWheatAlt,
    droplet: faDroplet,
    fire: faFire
  };

  get nome(): string {
    return this.alimentoPasto?.nomeVisualizzato || this.alimentoPasto?.alimento?.nome || 'Alimento';
  }

  get quantita(): number {
    return this.alimentoPasto?.quantita || 0;
  }

  get misura(): string {
    return 'g';
  }

  calcolaMacro(macro: MacroType): number {
    const macros = this.alimentoPasto?.alimento?.macroNutrienti;
    if (!macros) return 0;
    const misuraGrammi = this.alimentoPasto?.alimento?.misuraInGrammi || 100;
    return ((macros as any)[macro] || 0) * this.quantita / misuraGrammi;
  }

  onQuantitaChange(value: number): void {
    if (value > 0) {
      this.quantitaChanged.emit(value);
    }
  }

  onRemove(): void {
    this.removed.emit();
  }

  startEditNome(): void {
    this.editingNome = true;
    this.editNomeValue = this.alimentoPasto?.nomeCustom || this.alimentoPasto?.alimento?.nome || '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.nomeInput?.nativeElement?.focus();
      this.nomeInput?.nativeElement?.select();
    }, 0);
  }

  cancelEditNome(): void {
    this.editingNome = false;
    this.editNomeValue = '';
    this.cdr.detectChanges();
  }

  confirmEditNome(): void {
    if (!this.alimentoPasto?.id) return;

    const nome = this.editNomeValue.trim();
    const catalogo = (this.alimentoPasto?.alimento?.nome || '').trim();

    this.editingNome = false;

    if (!nome || nome === catalogo) {
      this.displayNameChange.emit({ alimentoPastoId: this.alimentoPasto.id, nome: null });
    } else {
      this.displayNameChange.emit({ alimentoPastoId: this.alimentoPasto.id, nome });
    }
    this.cdr.detectChanges();
  }

  onNomeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmEditNome();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditNome();
    }
  }
}
