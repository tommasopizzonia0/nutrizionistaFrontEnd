import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faDumbbell, faFire, faFlask, faLeaf, faSpoon, faWheatAlt, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AlimentoBaseDto } from '../../dto/alimento-base.dto';

interface MicroItem {
  label: string;
  value: string;
  unit: string;
  pct?: number;
}

interface MicroCategory {
  name: string;
  items: MicroItem[];
}

@Component({
  selector: 'app-modal-alimento',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './modal-alimento.html',
  styleUrls: ['./modal-alimento.css'],
})
export class ModalAlimento implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() loading = false;
  @Input() alimento?: AlimentoBaseDto;
  @Input() pastoTargetLabel?: string;
  @Input() quantita = 100;
  @Input() isDarkMode = false;

  @Output() closed = new EventEmitter<void>();
  @Output() addRequested = new EventEmitter<{ alimento: AlimentoBaseDto; quantita: number }>();

  @ViewChild('dialog') dialog?: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') closeBtn?: ElementRef<HTMLButtonElement>;

  protected readonly icons = {
    close: faXmark,
    info: faCircleInfo,
    fire: faFire,
    protein: faDumbbell,
    carbs: faWheatAlt,
    fats: faLeaf,
    micro: faFlask,
    portion: faSpoon
  };

  macroItems: Array<{ key: string; label: string; value: string; unit: string }> = [];
  extendedMacroItems: Array<{ key: string; label: string; value: string; unit: string }> = [];
  microCategories: MicroCategory[] = [];
  qty = 100;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.lockScroll(true);
        setTimeout(() => this.closeBtn?.nativeElement?.focus(), 0);
      } else {
        this.lockScroll(false);
      }
    }
    if (changes['quantita']) {
      const q = Number(this.quantita);
      this.qty = Number.isFinite(q) && q > 0 ? q : 100;
    }
    if (changes['alimento'] || changes['loading']) {
      this.computeViewModel();
    }
  }

  ngOnDestroy(): void {
    this.lockScroll(false);
  }

  onBackdropClick(): void {
    if (this.loading) return;
    this.close();
  }

  onDialogClick(event: Event): void {
    event.stopPropagation();
  }

  close(): void {
    this.open = false;
    this.closed.emit();
  }

  requestAdd(): void {
    if (!this.alimento) return;
    const q = Number(this.qty);
    if (!Number.isFinite(q) || q <= 0) return;
    this.addRequested.emit({ alimento: this.alimento, quantita: q });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!this.loading) this.close();
    }
  }

  private lockScroll(lock: boolean): void {
    const body = document?.body;
    if (!body) return;
    body.style.overflow = lock ? 'hidden' : '';
  }

  private computeViewModel(): void {
    const a = this.alimento;
    const nd = 'N.D.';

    const kcal = a?.macroNutrienti?.calorie;
    const p = a?.macroNutrienti?.proteine;
    const c = a?.macroNutrienti?.carboidrati;
    const g = a?.macroNutrienti?.grassi;

    this.macroItems = [
      { key: 'kcal', label: 'Calorie', value: this.fmtNumber(kcal, 0, nd), unit: 'kcal' },
      { key: 'p', label: 'Proteine', value: this.fmtNumber(p, 1, nd), unit: 'g' },
      { key: 'c', label: 'Carboidrati', value: this.fmtNumber(c, 1, nd), unit: 'g' },
      { key: 'g', label: 'Grassi', value: this.fmtNumber(g, 1, nd), unit: 'g' }
    ];

    this.extendedMacroItems = [
      { key: 'fibre', label: 'Fibre', value: this.fmtNumber(a?.macroNutrienti?.fibre, 1, nd), unit: 'g' },
      { key: 'zuccheri', label: 'Zuccheri', value: this.fmtNumber(a?.macroNutrienti?.zuccheri, 1, nd), unit: 'g' },
      { key: 'grassiSaturi', label: 'Grassi saturi', value: this.fmtNumber(a?.macroNutrienti?.grassiSaturi, 1, nd), unit: 'g' },
      { key: 'sodio', label: 'Sodio', value: this.fmtNumber(a?.macroNutrienti?.sodio, 1, nd), unit: 'mg' },
      { key: 'alcol', label: 'Alcol', value: this.fmtNumber(a?.macroNutrienti?.alcol, 1, nd), unit: 'g' },
      { key: 'acqua', label: 'Acqua', value: this.fmtNumber(a?.macroNutrienti?.acqua, 1, nd), unit: 'g' },
      { key: 'sale', label: 'Sale', value: this.fmtNumber(a?.macroNutrienti?.sale, 2, nd), unit: 'g' }
    ];

    // Build dynamic micro categories from ValoreMicroDto list
    const micros = (a?.micronutrienti ?? []).slice();
    const categoryMap = new Map<string, MicroItem[]>();

    for (const m of micros) {
      const name = String(m?.micronutriente?.nome || '').trim();
      const unit = String(m?.micronutriente?.unita || '').trim();
      const valueNum = Number(m?.valore);
      const value = Number.isFinite(valueNum) ? this.fmtNumber(valueNum, 2, nd) : nd;
      const vnr = this.getVnr(name);
      const pct = vnr && Number.isFinite(valueNum) && vnr.unit === unit && vnr.value > 0
        ? Math.max(0, Math.min(100, (valueNum / vnr.value) * 100))
        : undefined;
      const cat = this.normalizeCategory(m?.micronutriente?.categoria, name);

      const arr = categoryMap.get(cat) ?? [];
      arr.push({
        label: name || nd,
        value,
        unit: unit || '',
        pct: pct !== undefined ? Number(pct.toFixed(1)) : undefined
      });
      categoryMap.set(cat, arr);
    }

    // Build sorted categories array
    const order = ['Vitamine', 'Minerali'];
    this.microCategories = [];

    for (const catName of order) {
      const items = categoryMap.get(catName);
      if (items && items.length > 0) {
        this.microCategories.push({
          name: catName,
          items: items.sort((a, b) => a.label.localeCompare(b.label, 'it'))
        });
        categoryMap.delete(catName);
      }
    }

    // Add remaining categories
    for (const [catName, items] of categoryMap.entries()) {
      if (items.length > 0) {
        this.microCategories.push({
          name: catName,
          items: items.sort((a, b) => a.label.localeCompare(b.label, 'it'))
        });
      }
    }
  }

  private fmtNumber(value: any, decimals: number, fallback: string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return n.toFixed(decimals).replace('.', ',');
  }

  private normalizeCategory(cat: any, name: string): string {
    const c = String(cat || '').trim().toLowerCase();
    if (c.includes('vit')) return 'Vitamine';
    if (c.includes('min')) return 'Minerali';
    const n = name.toLowerCase();
    if (n.includes('vit')) return 'Vitamine';
    return 'Altri';
  }

  private getVnr(name: string): { value: number; unit: string } | undefined {
    const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
    const map: Record<string, { value: number; unit: string }> = {
      'vitamina a': { value: 800, unit: 'µg' },
      'vitamina b1': { value: 1.1, unit: 'mg' },
      'tiamina': { value: 1.1, unit: 'mg' },
      'vitamina b2': { value: 1.4, unit: 'mg' },
      'riboflavina': { value: 1.4, unit: 'mg' },
      'vitamina b3': { value: 16, unit: 'mg' },
      'niacina': { value: 16, unit: 'mg' },
      'vitamina b6': { value: 1.4, unit: 'mg' },
      'vitamina b12': { value: 2.5, unit: 'µg' },
      'vitamina c': { value: 80, unit: 'mg' },
      'vitamina d': { value: 5, unit: 'µg' },
      'vitamina e': { value: 12, unit: 'mg' },
      'vitamina k': { value: 75, unit: 'µg' },
      'folati': { value: 200, unit: 'µg' },
      'acido folico': { value: 200, unit: 'µg' },
      'calcio': { value: 800, unit: 'mg' },
      'ferro': { value: 14, unit: 'mg' },
      'magnesio': { value: 375, unit: 'mg' },
      'fosforo': { value: 700, unit: 'mg' },
      'potassio': { value: 2000, unit: 'mg' },
      'zinco': { value: 10, unit: 'mg' },
      'rame': { value: 1, unit: 'mg' },
      'manganese': { value: 2, unit: 'mg' },
      'selenio': { value: 55, unit: 'µg' }
    };
    return map[n];
  }
}
