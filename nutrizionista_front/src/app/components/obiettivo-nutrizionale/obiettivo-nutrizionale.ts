import {
    Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges,
    inject, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faBullseye, faBolt, faFloppyDisk, faFire, faDumbbell,
    faWheatAlt, faDroplet, faSeedling, faInfoCircle, faLock, faLockOpen,
    faStar, faPlus, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { HttpErrorResponse } from '@angular/common/http';

import { ObiettivoService } from '../../services/obiettivo.service';
import { ClienteService } from '../../services/cliente.service';
import {
    ObiettivoNutrizionaleDto,
    ObiettivoNutrizionaleFormDto,
    TipoObiettivo,
    CalcoloErrorResponse
} from '../../dto/obiettivo-nutrizionale.dto';
import { PastoDto } from '../../dto/pasto.dto';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';
import { PresetObiettivoService, PresetObiettivoDto } from '../../services/preset-obiettivo.service';
import { Subscription } from 'rxjs';

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
export class ObiettivoNutrizionale implements OnInit, OnChanges, OnDestroy {
    @Input() clienteId!: number;
    @Input() pasti: PastoDto[] = [];
    @Input() isDarkMode = false;
    @Output() campiMancanti = new EventEmitter<string[]>();

    private obiettivoService = inject(ObiettivoService);
    private clienteService = inject(ClienteService);
    private presetService = inject(PresetObiettivoService);
    private cdr = inject(ChangeDetectorRef);
    private subs: Subscription[] = [];

    readonly icons = {
        target: faBullseye, bolt: faBolt, save: faFloppyDisk,
        fire: faFire, dumbbell: faDumbbell, wheat: faWheatAlt,
        droplet: faDroplet, seedling: faSeedling, info: faInfoCircle,
        lock: faLock, lockOpen: faLockOpen, star: faStar, plus: faPlus, trash: faTrash
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

    // Lock state for percentages
    lockedPct: Record<'proteine' | 'carboidrati' | 'grassi', boolean> = {
        proteine: false, carboidrati: false, grassi: false
    };

    // Lock state for grams
    lockedGrammi: Record<'proteine' | 'carboidrati' | 'grassi', boolean> = {
        proteine: false, carboidrati: false, grassi: false
    };

    // Peso del paziente (fetched from ClienteService)
    pesoCliente = 0;

    // Custom presets
    presets: PresetObiettivoDto[] = [];
    showPresetForm = false;
    presetName = '';

    // Collapsed state
    collapsed = false;

    ngOnInit(): void {
        this.loadObiettivo();
        this.loadPesoCliente();
        this.loadPresets();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    private buildForm(): ObiettivoNutrizionaleFormDto {
        return {
            obiettivo: this.tipoObiettivo,
            targetCalorie: this.targetCalorie || undefined,
            targetProteine: this.targetProteine || undefined,
            targetCarboidrati: this.targetCarboidrati || undefined,
            targetGrassi: this.targetGrassi || undefined,
            targetFibre: this.targetFibre || undefined,
            pctProteine: this.pctProteine || undefined,
            pctCarboidrati: this.pctCarboidrati || undefined,
            pctGrassi: this.pctGrassi || undefined,
            note: this.note || undefined,

            // Lock states
            lockedPctProteine: this.lockedPct.proteine,
            lockedPctCarboidrati: this.lockedPct.carboidrati,
            lockedPctGrassi: this.lockedPct.grassi,
            lockedGProteine: this.lockedGrammi.proteine,
            lockedGCarboidrati: this.lockedGrammi.carboidrati,
            lockedGGrassi: this.lockedGrammi.grassi
        };
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clienteId'] && !changes['clienteId'].firstChange) {
            this.loadObiettivo();
            this.loadPesoCliente();
        }
    }

    private loadPesoCliente(): void {
        if (!this.clienteId) return;
        this.subs.push(
            this.clienteService.dettaglio(this.clienteId).subscribe({
                next: (cliente) => {
                    this.pesoCliente = cliente?.peso || 0;
                    this.cdr.markForCheck();
                },
                error: () => { this.pesoCliente = 0; }
            })
        );
    }

    // --- Custom presets ---

    loadPresets(): void {
        this.subs.push(
            this.presetService.getAll().subscribe({
                next: (list) => {
                    this.presets = list;
                    this.cdr.markForCheck();
                },
                error: () => { this.presets = []; }
            })
        );
    }

    onPresetSelected(preset: PresetObiettivoDto): void {
        this.pctProteine = preset.pctProteine;
        this.pctCarboidrati = preset.pctCarboidrati;
        this.pctGrassi = preset.pctGrassi;

        if (this.obiettivo?.tdee) {
            this.targetCalorie = Math.round(this.obiettivo.tdee * preset.moltiplicatoreTdee);
            this.onCalorieChanged();
        }
    }

    saveAsPreset(): void {
        if (!this.presetName.trim()) return;
        const dto: PresetObiettivoDto = {
            nome: this.presetName.trim(),
            pctProteine: this.pctProteine,
            pctCarboidrati: this.pctCarboidrati,
            pctGrassi: this.pctGrassi,
            moltiplicatoreTdee: this.obiettivo?.tdee && this.targetCalorie
                ? +(this.targetCalorie / this.obiettivo.tdee).toFixed(2)
                : 1.0
        };
        this.presetService.crea(dto).subscribe({
            next: (saved) => {
                this.presets.push(saved);
                this.presetName = '';
                this.showPresetForm = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.errore = 'Errore salvataggio preset';
                console.error(err);
                this.cdr.markForCheck();
            }
        });
    }

    deletePreset(preset: PresetObiettivoDto, event: Event): void {
        event.stopPropagation();
        if (!preset.id) return;
        this.presetService.delete(preset.id).subscribe({
            next: () => {
                this.presets = this.presets.filter(p => p.id !== preset.id);
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error(err);
            }
        });
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

        // Restore lock states
        this.lockedPct = {
            proteine: !!dto.lockedPctProteine,
            carboidrati: !!dto.lockedPctCarboidrati,
            grassi: !!dto.lockedPctGrassi
        };
        this.lockedGrammi = {
            proteine: !!dto.lockedGProteine,
            carboidrati: !!dto.lockedGCarboidrati,
            grassi: !!dto.lockedGGrassi
        };
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

        this.obiettivoService.creaOAggiorna(this.clienteId, this.buildForm()).subscribe({
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
        if (!this.lockedPct.proteine && !this.lockedGrammi.proteine)
            this.targetProteine = +(this.targetCalorie * this.pctProteine / 100 / 4).toFixed(1);
        if (!this.lockedPct.carboidrati && !this.lockedGrammi.carboidrati)
            this.targetCarboidrati = +(this.targetCalorie * this.pctCarboidrati / 100 / 4).toFixed(1);
        if (!this.lockedPct.grassi && !this.lockedGrammi.grassi)
            this.targetGrassi = +(this.targetCalorie * this.pctGrassi / 100 / 9).toFixed(1);

    }

    onGrammiChanged(): void {
        const kcal = (this.targetProteine * 4) + (this.targetCarboidrati * 4) + (this.targetGrassi * 9);
        this.targetCalorie = Math.round(kcal);
        if (this.targetCalorie > 0) {
            if (!this.lockedPct.proteine)
                this.pctProteine = +((this.targetProteine * 4) / this.targetCalorie * 100).toFixed(1);
            if (!this.lockedPct.carboidrati)
                this.pctCarboidrati = +((this.targetCarboidrati * 4) / this.targetCalorie * 100).toFixed(1);
            if (!this.lockedPct.grassi)
                this.pctGrassi = +((this.targetGrassi * 9) / this.targetCalorie * 100).toFixed(1);
        }
    }

    onPercentualeChanged(changed: 'proteine' | 'carboidrati' | 'grassi'): void {
        // Ribilancia solo tra le % NON bloccate (esclusa quella appena modificata)
        const changedValue = (this as any)[`pct${changed.charAt(0).toUpperCase() + changed.slice(1)}`];
        const others = (['proteine', 'carboidrati', 'grassi'] as const).filter(x => x !== changed);
        const unlocked = others.filter(x => !this.lockedPct[x]);
        const lockedTotal = others.filter(x => this.lockedPct[x])
            .reduce((s, k) => s + ((this as any)[`pct${k.charAt(0).toUpperCase() + k.slice(1)}`] || 0), 0);

        const remaining = 100 - changedValue - lockedTotal;

        if (unlocked.length > 0) {
            const unlockedTotal = unlocked.reduce((s, k) => s + ((this as any)[`pct${k.charAt(0).toUpperCase() + k.slice(1)}`] || 0), 0);
            for (const k of unlocked) {
                const key = `pct${k.charAt(0).toUpperCase() + k.slice(1)}`;
                (this as any)[key] = unlockedTotal > 0
                    ? +((this as any)[key] / unlockedTotal * remaining).toFixed(1)
                    : +(remaining / unlocked.length).toFixed(1);
            }
        }

        if (this.targetCalorie > 0) {
            if (!this.lockedGrammi.proteine)
                this.targetProteine = +(this.targetCalorie * this.pctProteine / 100 / 4).toFixed(1);
            if (!this.lockedGrammi.carboidrati)
                this.targetCarboidrati = +(this.targetCalorie * this.pctCarboidrati / 100 / 4).toFixed(1);
            if (!this.lockedGrammi.grassi)
                this.targetGrassi = +(this.targetCalorie * this.pctGrassi / 100 / 9).toFixed(1);
        }
    }

    onObiettivoChanged(): void {
        const d = DEFAULTS[this.tipoObiettivo];
        // Applica preset solo alle % non bloccate
        if (!this.lockedPct.proteine) this.pctProteine = d.pct_p;
        if (!this.lockedPct.carboidrati) this.pctCarboidrati = d.pct_c;
        if (!this.lockedPct.grassi) this.pctGrassi = d.pct_g;

        // Ribilancia le % non bloccate per arrivare a 100%
        const lockedKeys = (['proteine', 'carboidrati', 'grassi'] as const).filter(k => this.lockedPct[k]);
        const unlockedKeys = (['proteine', 'carboidrati', 'grassi'] as const).filter(k => !this.lockedPct[k]);
        if (lockedKeys.length > 0 && unlockedKeys.length > 0) {
            const lockedTotal = lockedKeys.reduce((s, k) => (this as any)[`pct${k.charAt(0).toUpperCase() + k.slice(1)}`] + s, 0);
            const remaining = 100 - lockedTotal;
            const unlockedTotal = unlockedKeys.reduce((s, k) => (this as any)[`pct${k.charAt(0).toUpperCase() + k.slice(1)}`] + s, 0);
            for (const k of unlockedKeys) {
                const key = `pct${k.charAt(0).toUpperCase() + k.slice(1)}`;
                (this as any)[key] = unlockedTotal > 0
                    ? +((this as any)[key] / unlockedTotal * remaining).toFixed(1)
                    : +(remaining / unlockedKeys.length).toFixed(1);
            }
        }

        // If we have a TDEE, recalculate
        if (this.obiettivo?.tdee) {
            this.targetCalorie = Math.round(this.obiettivo.tdee * d.moltiplicatore);
            this.onCalorieChanged();
        }
    }

    toggleLock(macro: 'proteine' | 'carboidrati' | 'grassi'): void {
        this.lockedPct[macro] = !this.lockedPct[macro];
        this.cdr.markForCheck();
    }

    toggleLockGrammi(macro: 'proteine' | 'carboidrati' | 'grassi'): void {
        this.lockedGrammi[macro] = !this.lockedGrammi[macro];
        this.cdr.markForCheck();
    }

    getDelta(attuale: number, target: number): number {
        return Math.round(attuale - target);
    }

    // --- g/kg metrics ---

    getGPerKg(macro: 'proteine' | 'carboidrati' | 'grassi'): number {
        if (!this.pesoCliente) return 0;
        const grammi = macro === 'proteine' ? this.targetProteine
            : macro === 'carboidrati' ? this.targetCarboidrati
                : this.targetGrassi;
        return +(grammi / this.pesoCliente).toFixed(2);
    }

    onGPerKgChanged(macro: 'proteine' | 'carboidrati' | 'grassi', gPerKg: number): void {
        if (!this.pesoCliente || !gPerKg || gPerKg <= 0) return;
        const grammi = +(gPerKg * this.pesoCliente).toFixed(1);
        if (macro === 'proteine') this.targetProteine = grammi;
        else if (macro === 'carboidrati') this.targetCarboidrati = grammi;
        else this.targetGrassi = grammi;
        this.onGrammiChanged();
    }

    // --- Clinical Alerts ---

    getAlerts(): { tipo: 'warning' | 'danger'; msg: string }[] {
        const alerts: { tipo: 'warning' | 'danger'; msg: string }[] = [];

        // Calorie sotto BMR
        if (this.obiettivo?.bmr && this.targetCalorie > 0
            && this.targetCalorie < this.obiettivo.bmr) {
            alerts.push({
                tipo: 'warning',
                msg: `Calorie target (${this.targetCalorie}) sotto il BMR (${Math.round(this.obiettivo.bmr)}). Monitorare attentamente.`
            });
        }

        // Grassi essenziali troppo bassi
        if (this.pesoCliente && this.targetGrassi > 0) {
            const gPerKg = this.targetGrassi / this.pesoCliente;
            if (gPerKg < 0.8) {
                alerts.push({
                    tipo: 'danger',
                    msg: `Grassi (${gPerKg.toFixed(1)} g/kg) sotto soglia minima (0.8 g/kg). Rischio ormonale.`
                });
            }
        }

        // Proteine molto alte
        if (this.pesoCliente && this.targetProteine > 0) {
            const gPerKg = this.targetProteine / this.pesoCliente;
            if (gPerKg > 2.5) {
                alerts.push({
                    tipo: 'warning',
                    msg: `Proteine elevate (${gPerKg.toFixed(1)} g/kg). Verificare funzionalità renale.`
                });
            }
        }

        return alerts;
    }

    // --- Percentuale validation ---

    getPctTotal(): number {
        return +(this.pctProteine + this.pctCarboidrati + this.pctGrassi).toFixed(1);
    }

    isPctValid(): boolean {
        return Math.abs(this.getPctTotal() - 100) < 0.5;
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
