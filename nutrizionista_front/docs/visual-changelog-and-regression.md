# Changelog visivo & regressione (no brand drift)

Questo documento descrive:
- cosa è cambiato (before/after) in termini UI/UX, senza alterare identità visiva
- come validare “pixel-perfect” su 320–1920px
- come eseguire regressioni automatiche (Playwright screenshot + Percy opzionale)
- come eseguire smoke test accessibilità (WCAG 2.2 AA)

## 1) Before/After (cosa osservare)

### Scheda Dieta
- **Pasti default**
  - Before: i 4 pasti erano creati/forzati lato frontend (placeholder id=-1, creazione on-demand al primo alimento).
  - After: i 4 pasti default arrivano già dal backend su creazione scheda; il frontend li renderizza senza cambiare struttura DOM.
- **Pasti personalizzati**
  - Before: la lista pasti era limitata ai 4 default (merge “chiuso”).
  - After: vengono mostrati anche i pasti custom del backend (ordinati per `ordineVisualizzazione`), con azioni coerenti con lo stile (`icon-btn`).
- **Override nome alimento**
  - Before: veniva mostrato sempre `alimento.nome` (catalogo).
  - After: viene mostrato `nomeVisualizzato` quando presente, con possibilità di impostare/rimuovere override per scheda.

File chiave:
- UI: [scheda-dieta.html](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/scheda-dieta/scheda-dieta.html), [alimento-aggiunto.html](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/alimento-aggiunto/alimento-aggiunto.html)
- Logica: [scheda-dieta.ts](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/scheda-dieta/scheda-dieta.ts)

## 2) Validazione pixel-perfect (viewport 320–1920)

Viewport minimi consigliati:
- 320×800, 375×800, 768×900, 1024×900, 1440×900, 1920×1080

Checklist UI:
- Nessun drift su: palette, font, icone, bordi, radius, spacing, grid.
- Nessun wrapping/overflow indesiderato su header pasti, badges, input quantità.
- Gli stati hover/focus restano coerenti.

## 3) Regressione automatica (Playwright screenshot)

Sono stati aggiunti test screenshot Playwright:
- [visual-regression.spec.ts](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/e2e/visual-regression.spec.ts)
- Config: [playwright.config.ts](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/playwright.config.ts)

Prerequisiti:
- Frontend in esecuzione (default): `http://localhost:4200`
- (solo per test auth) variabili ambiente:
  - `E2E_EMAIL`, `E2E_PASSWORD`
  - opzionale `E2E_API_URL` (default `http://localhost:8080`)
  - opzionale `E2E_BASE_URL` (default `http://localhost:4200`)

Comandi:
- Generare/aggiornare baseline screenshot:
  - `npm run e2e:update`
- Eseguire regressione:
  - `npm run e2e`

Output:
- Playwright salva screenshot di confronto nella cartella standard dei test (snapshots Playwright).

## 4) Percy (opzionale)

È integrato il supporto Percy per snapshot remote.
Per abilitare:
- impostare `PERCY_TOKEN`
- eseguire:
  - `npm run e2e:percy`

Nota:
- I test Percy vengono eseguiti solo se `percy exec` imposta `PERCY_SERVER_ADDRESS` (condizione già gestita nel codice).

## 5) Accessibilità (WCAG 2.2 AA smoke)

È presente uno smoke test con Axe (Playwright) che verifica assenza di violazioni **serious/critical** sulla home:
- sezione `A11y smoke` in [visual-regression.spec.ts](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/e2e/visual-regression.spec.ts)

Esecuzione:
- stesso comando dei Playwright test (`npm run e2e`)
- i test auth vengono automaticamente skippati se mancano `E2E_EMAIL/E2E_PASSWORD`

## 6) Performance (≤2s su 3G)

Misura consigliata (manuale + ripetibile):
- Chrome DevTools → Performance/Network
- Throttling: “Fast 3G”, CPU 4× slowdown
- Misurare: FCP/LCP e tempo di caricamento della route critica (`/home`, `/scheda-dieta/:clienteId`)

Automazione consigliata (non ancora introdotta in repo):
- Lighthouse CI (lhci) con budget su LCP, TBT, transfer size.

