import { computeMacroPercentages, computeNutritionTotalsFromPasti, formatThousands } from './nutrition-metrics';

describe('nutrition-metrics', () => {
  it('computes percentages with zero totals', () => {
    const pct = computeMacroPercentages({ kcal: 0, proteineG: 0, carboidratiG: 0, grassiG: 0 });
    expect(pct.proteinePct).toBe(0);
    expect(pct.carboidratiPct).toBe(0);
    expect(pct.grassiPct).toBe(0);
  });

  it('formats thousands with it-IT locale', () => {
    expect(formatThousands(1234, 'it-IT')).toBe('1.234');
  });

  it('computes totals from pasto alimentiPasto', () => {
    const totals = computeNutritionTotalsFromPasti([
      {
        id: 1,
        nome: 'Test',
        alimentiPasto: [
          {
            id: 1,
            quantita: 200,
            alimento: {
              nome: 'A',
              misuraInGrammi: 100,
              macroNutrienti: { calorie: 100, proteine: 10, carboidrati: 20, grassi: 5 }
            }
          }
        ]
      } as any
    ]);

    expect(totals.kcal).toBe(200);
    expect(totals.proteineG).toBeCloseTo(20, 6);
    expect(totals.carboidratiG).toBeCloseTo(40, 6);
    expect(totals.grassiG).toBeCloseTo(10, 6);
  });
});

