# Catalogo alimenti: paginazione, ricerca e ordinamento

## Flusso dati
- Modalità paginata: il catalogo carica pagine dal backend tramite `GET /api/alimenti_base?page=&size=` e mostra prev/next.
- Modalità ricerca: con `searchQuery` non vuota il catalogo usa `GET /api/alimenti_base/search?query=` e applica paginazione client-side sui risultati.

## Race condition (problema) e soluzione
Problema tipico: una richiesta di ricerca può completare dopo un cambio pagina o dopo lo svuotamento della query, sovrascrivendo la lista.

Soluzione: nel componente `CatalogoAlimenti` la UI è guidata da uno stream unico `query + page` con `switchMap`, che cancella automaticamente le richieste precedenti.

## Ordinamento alfabetico
- Backend: la lista paginata applica di default `nome ASC` (case-insensitive) quando il client non specifica sort.
- Frontend: i risultati di ricerca vengono ordinati prima della renderizzazione con `localeCompare` (sensibilità base) per gestire maiuscole/minuscole e punteggiatura.

# Scheda dieta: grafico percentuali macronutrienti

## Libreria
Il grafico usa Chart.js (pie chart) e visualizza la percentuale relativa di Proteine/Carboidrati/Grassi calcolata sui pasti della scheda.

## Bug di rendering (root cause) e fix
Root cause: il canvas era renderizzato solo quando `macroChartHasData` era true, ma la funzione di update usciva subito se il canvas non esisteva, impedendo a `macroChartHasData` di diventare true.

Fix: il calcolo di `macroChartHasData` viene eseguito anche senza canvas; quando passa a true, viene schedulato un update successivo per creare/aggiornare Chart.js.

# Test

## Frontend
- Test unitari includono:
  - ordinamento alfabetico del catalogo
  - rendering/attivazione del grafico con dati di test (Chart.js stub)

## Backend
- Test di integrazione verificano:
  - sort default su `GET /api/alimenti_base` quando non viene passato alcun sort
  - rispetto del sort esplicito (`sort=nome,desc`)
