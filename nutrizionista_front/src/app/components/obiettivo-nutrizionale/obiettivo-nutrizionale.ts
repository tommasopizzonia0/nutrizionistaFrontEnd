import {
    Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges,
    inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faBullseye, faBolt, faFloppyDisk, faFire, faDumbbell,
    faWheatAlt, faDroplet, faSeedling, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { HttpErrorResponse } from '@angular/common/http';

import { ObiettivoService } from '../../services/obiettivo.service';
import {
    ObiettivoNutrizionaleDto,
    ObiettivoNutrizionaleFormDto,
    TipoObiettivo,
    CalcoloErrorResponse
} from '../../dto/obiettivo-nutrizionale.dto';
import { PastoDto } from '../../dto/pasto.dto';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';

// Default macro % per obiettivo
const DEFAULTS: Record<TipoObiettivo, { pct_p: number; pct_c: number; pct_g: number; moltiplicatore: number }> = {
    DIMAGRIMENTO: { pct_p: 35, pct_c: 35, pct_g: 30, moltiplicatore: 0.80 },
    MANTENIMENTO: { pct_p: 25, pct_c: 50, pct_g: 25, moltiplicatore: 1.00 },
    MASSA: { pct_p: 30, pct_c: 45, pct_g: 25, moltiplicatore: 1.15 },
    RICOMPOSIZIONE: { pct_p: 40, pct_c: 30, pct_g: 30, moltiplicatore: 0.95 },
};

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie' | 'fibre';

@Component({
    selector: 'app-obiettivo-nutrizionale',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './obiettivo-nutrizionale.html',
    styleUrl: './obiettivo-nutrizionale.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObiettivoNutrizionale implements OnInit, OnChanges {
    @Input() clienteId!: number;
    @Input() pasti: PastoDto[] = [];
    @Input() isDarkMode = false;
    @Output() campiMancanti = new EventEmitter<string[]>();

    private obiettivoService = inject(ObiettivoService);
    private cdr = inject(ChangeDetectorRef);

    readonly icons = {
        target: faBullseye, bolt: faBolt, save: faFloppyDisk,
        fire: faFire, dumbbell: faDumbbell, wheat: faWheatAlt,
        droplet: faDroplet, seedling: faSeedling, info: faInfoCircle
    };

    readonly obiettivi: TipoObiettivo[] = ['DIMAGRIMENTO', 'MANTENIMENTO', 'MASSA', 'RICOMPOSIZIONE'];
    readonly obiettivoLabels: Record<TipoObiettivo, string> = {
        DIMAGRIMENTO: 'Dimagrimento',
        MANTENIMENTO: 'Mantenimento',
        MASSA: 'Massa',
        RICOMPOSIZIONE: 'Ricomposizione'
    };

    obiettivo?: ObiettivoNutrizionaleDto;
    loading = false;
    saving = false;
    calcolando = false;
    errore = '';

    // Form model
    tipoObiettivo: TipoObiettivo = 'MANTENIMENTO';
    targetCalorie = 0;
    targetProteine = 0;
    targetCarboidrati = 0;
    targetGrassi = 0;
    targetFibre = 25;
    pctProteine = 25;
    pctCarboidrati = 50;
    pctGrassi = 25;
    note = '';

    // Collapsed state
    collapsed = false;

    ngOnInit(): void {
        this.loadObiettivo();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clienteId'] && !changes['clienteId'].firstChange) {
            this.loadObiettivo();
        }
    }

    loadObiettivo(): void {
        if (!this.clienteId) return;
        this.loading = true;
        this.cdr.markForCheck();

        this.obiettivoService.get(this.clienteId).subscribe({
            next: (dto) => {
                if (dto) {
                    this.obiettivo = dto;
                    this.populateForm(dto);
                } else {
                    // 204 No Content → null body → no obiettivo yet
                    this.obiettivo = undefined;
                }
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.obiettivo = undefined;
                this.loading = false;
                if (err.status !== 204 && err.status !== 0) {
                    console.error('Errore caricamento obiettivo:', err);
                }
                this.cdr.markForCheck();
            }
        });
    }

    private populateForm(dto: ObiettivoNutrizionaleDto): void {
        this.tipoObiettivo = dto.obiettivo || 'MANTENIMENTO';
        this.targetCalorie = dto.targetCalorie || 0;
        this.targetProteine = dto.targetProteine || 0;
        this.targetCarboidrati = dto.targetCarboidrati || 0;
        this.targetGrassi = dto.targetGrassi || 0;
        this.targetFibre = dto.targetFibre || 25;
        this.pctProteine = dto.pctProteine || 25;
        this.pctCarboidrati = dto.pctCarboidrati || 50;
        this.pctGrassi = dto.pctGrassi || 25;
        this.note = dto.note || '';
    }

    onCalcola(): void {
        this.calcolando = true;
        this.errore = '';
        this.cdr.markForCheck();

        const selectedObiettivo = this.tipoObiettivo;

        this.obiettivoService.calcola(this.clienteId).subscribe({
            next: (dto) => {
                this.obiettivo = dto;
                this.populateForm(dto);
                // Ripristina l'obiettivo scelto dall'utente e ricalcola i macro
                this.tipoObiettivo = selectedObiettivo;
                this.onObiettivoChanged();
                this.calcolando = false;
                this.cdr.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.calcolando = false;
                if (err.status === 422) {
                    const body = err.error as CalcoloErrorResponse;
                    this.campiMancanti.emit(body.campiMancanti);
                } else {
                    this.errore = 'Errore nel calcolo BMR/TDEE';
                }
                this.cdr.markForCheck();
            }
        });
    }

    onSalva(): void {
        this.saving = true;
        this.errore = '';
        this.cdr.markForCheck();

        const form: ObiettivoNutrizionaleFormDto = {
            obiettivo: this.tipoObiettivo,
            targetCalorie: this.targetCalorie || undefined,
            targetProteine: this.targetProteine || undefined,
            targetCarboidrati: this.targetCarboidrati || undefined,
            targetGrassi: this.targetGrassi || undefined,
            targetFibre: this.targetFibre || undefined,
            pctProteine: this.pctProteine || undefined,
            pctCarboidrati: this.pctCarboidrati || undefined,
            pctGrassi: this.pctGrassi || undefined,
            note: this.note || undefined
        };

        this.obiettivoService.creaOAggiorna(this.clienteId, form).subscribe({
            next: (dto) => {
                this.obiettivo = dto;
                this.populateForm(dto);
                this.saving = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.saving = false;
                this.errore = 'Errore nel salvataggio';
                console.error(err);
                this.cdr.markForCheck();
            }
        });
    }

    // --- Cascading updates ---

    onCalorieChanged(): void {
        if (!this.targetCalorie) return;
        this.targetProteine = +(this.targetCalorie * this.pctProteine / 100 / 4).toFixed(1);
        this.targetCarboidrati = +(this.targetCalorie * this.pctCarboidrati / 100 / 4).toFixed(1);
        this.targetGrassi = +(this.targetCalorie * this.pctGrassi / 100 / 9).toFixed(1);
    }

    onGrammiChanged(): void {
        const kcal = (this.targetProteine * 4) + (this.targetCarboidrati * 4) + (this.targetGrassi * 9);
        this.targetCalorie = Math.round(kcal);
        if (this.targetCalorie > 0) {
            this.pctProteine = +((this.targetProteine * 4) / this.targetCalorie * 100).toFixed(1);
            this.pctCarboidrati = +((this.targetCarboidrati * 4) / this.targetCalorie * 100).toFixed(1);
            this.pctGrassi = +((this.targetGrassi * 9) / this.targetCalorie * 100).toFixed(1);
        }
    }

    onPercentualeChanged(changed: 'proteine' | 'carboidrati' | 'grassi'): void {
        // Ribilancia le altre due proporzionalmente
        const remaining = 100 - (this as any)[`pct${changed.charAt(0).toUpperCase() + changed.slice(1)}`];
        const others = (['proteine', 'carboidrati', 'grassi'] as const).filter(x => x !== changed);
        const otherTotal = others.reduce((s, k) => s + ((this as any)[`pct${k.charAt(0).toUpperCase() + k.slice(1)}`] || 0), 0);

        if (otherTotal > 0) {
            for (const k of others) {
                const key = `pct${k.charAt(0).toUpperCase() + k.slice(1)}`;
                (this as any)[key] = +((this as any)[key] / otherTotal * remaining).toFixed(1);
            }
        }

        if (this.targetCalorie > 0) {
            this.targetProteine = +(this.targetCalorie * this.pctProteine / 100 / 4).toFixed(1);
            this.targetCarboidrati = +(this.targetCalorie * this.pctCarboidrati / 100 / 4).toFixed(1);
            this.targetGrassi = +(this.targetCalorie * this.pctGrassi / 100 / 9).toFixed(1);
        }
    }

    onObiettivoChanged(): void {
        const d = DEFAULTS[this.tipoObiettivo];
        this.pctProteine = d.pct_p;
        this.pctCarboidrati = d.pct_c;
        this.pctGrassi = d.pct_g;
        // If we have a TDEE, recalculate
        if (this.obiettivo?.tdee) {
            this.targetCalorie = Math.round(this.obiettivo.tdee * d.moltiplicatore);
            this.onCalorieChanged();
        }
    }

    // --- Progress bars (attuale vs target) ---

    getAttualeCalorie(): number {
        return this.pasti.reduce((sum, p) => {
            if (!p.alimentiPasto) return sum;
            return sum + p.alimentiPasto.reduce((s, ap) => {
                const cal = ap.alimento?.macroNutrienti?.calorie || 0;
                return s + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
            }, 0);
        }, 0);
    }

    getAttualeMacro(macro: MacroType): number {
        return this.pasti.reduce((sum, p) => {
            if (!p.alimentiPasto) return sum;
            return sum + p.alimentiPasto.reduce((s, ap) => {
                const macros = ap.alimento?.macroNutrienti;
                if (!macros) return s;
                return s + ((macros as any)[macro] || 0) * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100);
            }, 0);
        }, 0);
    }

    getPercentuale(attuale: number, target: number): number {
        if (!target || target <= 0) return 0;
        return Math.round(attuale / target * 100);
    }

    getBarClass(pct: number): string {
        if (pct >= 110) return 'bar-over';
        if (pct >= 80) return 'bar-ok';
        return 'bar-under';
    }

    getBarWidth(pct: number): number {
        return Math.min(pct, 120);
    }
}
