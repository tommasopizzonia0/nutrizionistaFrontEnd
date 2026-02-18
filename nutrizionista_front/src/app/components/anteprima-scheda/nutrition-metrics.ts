import { PastoDto } from '../../dto/pasto.dto';

export type MacroKey = 'proteine' | 'carboidrati' | 'grassi';

export interface NutritionTotals {
  kcal: number;
  proteineG: number;
  carboidratiG: number;
  grassiG: number;
}

export interface NutritionPercentages {
  proteinePct: number;
  carboidratiPct: number;
  grassiPct: number;
}

export function computeNutritionTotalsFromPasti(pasti: PastoDto[] | undefined): NutritionTotals {
  const totals: NutritionTotals = { kcal: 0, proteineG: 0, carboidratiG: 0, grassiG: 0 };
  if (!pasti || pasti.length === 0) return totals;

  for (const pasto of pasti) {
    for (const ap of (pasto.alimentiPasto || [])) {
      const alimento = ap?.alimento;
      const macros = alimento?.macroNutrienti;
      if (!macros) continue;
      const misura = alimento?.misuraInGrammi || 100;
      const qty = ap?.quantita || 0;
      const factor = qty / misura;
      totals.kcal += Math.round((macros.calorie || 0) * factor);
      totals.proteineG += (macros.proteine || 0) * factor;
      totals.carboidratiG += (macros.carboidrati || 0) * factor;
      totals.grassiG += (macros.grassi || 0) * factor;
    }
  }

  return totals;
}

export function computeMacroPercentages(totals: NutritionTotals): NutritionPercentages {
  const sum = totals.proteineG + totals.carboidratiG + totals.grassiG;
  if (sum <= 0) return { proteinePct: 0, carboidratiPct: 0, grassiPct: 0 };
  return {
    proteinePct: (totals.proteineG / sum) * 100,
    carboidratiPct: (totals.carboidratiG / sum) * 100,
    grassiPct: (totals.grassiG / sum) * 100
  };
}

export function formatThousands(value: number, locale = 'it-IT'): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const s = Math.abs(rounded).toString();
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (locale !== 'it-IT') return sign + grouped;
  return sign + grouped;
}
