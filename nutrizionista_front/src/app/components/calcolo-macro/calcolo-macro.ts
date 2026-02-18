import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie, faDumbbell, faWheatAlt, faDroplet, faFire } from '@fortawesome/free-solid-svg-icons';
import { PastoDto } from '../../dto/pasto.dto';
import { AlimentoPastoDto } from '../../dto/alimento-pasto.dto';

type MacroType = 'proteine' | 'carboidrati' | 'grassi' | 'calorie';

@Component({
  selector: 'app-calcolo-macro',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './calcolo-macro.html',
  styleUrl: './calcolo-macro.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalcoloMacro {
  @Input() pasti: PastoDto[] = [];
  @Input() isDarkMode = false;

  readonly icons = {
    chart: faChartPie,
    dumbbell: faDumbbell,
    wheat: faWheatAlt,
    droplet: faDroplet,
    fire: faFire
  };

  // Calcolo macro per singolo alimento nel pasto
  calcolaMacro(ap: AlimentoPastoDto, macro: MacroType): number {
    const macros = ap.alimento?.macroNutrienti;
    if (!macros) return 0;
    return ((macros as any)[macro] || 0) * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100);
  }

  // Totale calorico per singolo pasto
  calcolaTotaleCalorico(pasto: PastoDto): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => {
      const cal = ap.alimento?.macroNutrienti?.calorie || 0;
      return sum + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
    }, 0);
  }

  // Totale macro per singolo pasto
  calcolaTotaleMacro(pasto: PastoDto, macro: MacroType): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => sum + this.calcolaMacro(ap, macro), 0);
  }

  // Totale giornaliero per macro
  calcolaTotaleGiornaliero(macro: MacroType): number {
    return this.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleMacro(pasto, macro), 0);
  }

  // Totale calorie giornaliere
  calcolaTotaleCalorieGiornaliere(): number {
    return this.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleCalorico(pasto), 0);
  }
}
