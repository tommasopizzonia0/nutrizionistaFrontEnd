# Fase 3 – Pasti Personalizzati (Templates)

Migrazione dei template pasto da `localStorage` a database per persistenza e sincronizzazione tra dispositivi.

---

## 1. Architettura Database

### [NEW] `PastoTemplate.java` (Entità)
- `Long id`
- `String nome`
- `String descrizione`
- `@ManyToOne Utente createdBy`
- `@OneToMany(mappedBy = "template", cascade = ALL) List<PastoTemplateAlimento> alimenti`
- `Instant createdAt, updatedAt`

### [NEW] `PastoTemplateAlimento.java` (Entità)
- `Long id`
- `@ManyToOne PastoTemplate template`
- `@ManyToOne AlimentoBase alimento`
- `Double quantita`

---

## 2. Backend Implementation

### Controller `/api/pasti_templates`
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/` | Lista template dell'utente loggato |
| `POST` | `/` | Crea nuovo template (con lista alimenti) |
| `PUT` | `/{id}` | Aggiorna template esistente |
| `DELETE` | `/{id}` | Elimina template |

---

## 3. Frontend Implementation

### [AlimentoService](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/services/alimento-service.ts#7-129)
- Aggiungere metodi per CRUD [PastoTemplate](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/screens/alimenti-page/alimenti-page.ts#36-43).

### [AlimentiPageComponent](file:///c:/Users/Utente/Documents/GitHub/nutrizionistaFrontEnd/nutrizionista_front/src/app/screens/alimenti-page/alimenti-page.ts#53-868)
- Migrare `pastiTemplates` da `localStorage` all'uso del servizio.
- Gestire la modale di editing/creazione con salvataggio server-side.

---

## Ordine di Esecuzione

1. **Definizione Entità & Mapper**: Creazione delle classi Java e mapping DTO.
2. **Sviluppo CRUD Backend**: Controller, Service e Repository.
3. **Integrazione Frontend**: Sostituzione della logica `localStorage` e test.

---

> [!NOTE]
> La logica di calcolo macro per i template rimarrà client-side per immediatezza nella UI, ma i dati verranno persistiti ad ogni modifica.
