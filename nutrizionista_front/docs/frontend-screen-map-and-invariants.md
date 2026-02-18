# Mappa schermate & invarianti UI (frontend)

Obiettivo: applicare evoluzioni funzionali (API/flow/contenuti) preservando integralmente identità visiva e layout esistente.

## Invarianti (da non alterare)
- Palette colori e variabili CSS globali: [styles.css](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/styles.css)
- Font stack e tipografia: componenti e globali (es. [scheda-dieta.css](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/scheda-dieta/scheda-dieta.css))
- Logo e asset: [public/assets/img](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/public/assets/img)
- Spaziature, griglia responsive e breakpoint: layout grid principali (es. [scheda-dieta.css](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/scheda-dieta/scheda-dieta.css), [cliente-dettaglio.css](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/cliente-dettaglio/cliente-dettaglio.css))
- Animazioni/transizioni: mantenere durata/easing già presenti (hover, slideDown, ecc.)
- Accessibilità esistente: label, aria-label, focus ring, contrasto (non ridurre contrasto o rimuovere indicatori focus)

## Rotte e schermate (inventario)
Definite in: [app.routes.ts](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/app.routes.ts)

### Auth (senza layout principale)
- `/login` → [login](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/screens/login/login.ts)
  - Invarianti: sfondo/hero, logo, campi, CTA primarie, messaggistica errori.
- `/register` → [register-screen](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/screens/register-screen/register-screen.ts)
  - Invarianti: stesso tono e pattern form di login.

### App (con MainLayout + Navbar)
Layout: [main-layout](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/layouts/main-layout/main-layout.component/main-layout.component.ts)
Navbar: [navbar](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/navbar/navbar.ts)

- `/home` → [home](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/screens/home/home.ts)
- `/clienti` → [clienti](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/clienti/clienti.ts)
- `/clienti/:id` → [cliente-dettaglio](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/cliente-dettaglio/cliente-dettaglio.ts)
  - Sotto-viste:
    - info (card anagrafiche e sanitarie)
    - misurazioni (lista + nuova misurazione)
    - schede dieta (master-detail lista/preview + full editor)
- `/scheda-dieta/:clienteId` → [scheda-dieta](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/scheda-dieta/scheda-dieta.ts)
  - Invarianti: griglia 2 colonne (lista pasti + sidebar), card pasti, macro badge, chart, spaziature e tipografia.
- `/misurazione/:clienteId` → [misurazione](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/misurazione/misurazione.ts)
- `/plicometria/:clienteId` → [plicometria](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/plicometria/plicometria.ts)
- `/agenda` → [agenda](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/agenda/agenda.ts)
- `/profilo` → [user-profile](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/user-profile/user-profile.ts)
- `/settings` → [settings](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/components/settings/settings.ts)

## Punti di integrazione “safe” (no drift UI)
- Cambiamento API/DTO: modificare servizi e binding dati senza introdurre wrapper HTML aggiuntivi.
- Per nuove feature: preferire elementi già stilati (es. `icon-btn`, `btn-primary`) e mantenere le stesse spaziature (gap, padding, border-radius).
- Per contenuti dinamici (pasti custom, nomi custom alimenti): usare fallback stringa in rendering senza cambiare struttura DOM principale.

