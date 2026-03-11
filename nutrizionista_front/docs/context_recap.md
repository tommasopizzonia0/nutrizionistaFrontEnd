# Context Recap – Progetto Nutrizionista

## Architettura

| Layer | Tech | Repo | Path |
|-------|------|------|------|
| **Frontend** | Angular 19 (standalone), TypeScript | `nutrizionistaFrontEnd` | `c:\Users\Utente\Documents\GitHub\nutrizionistaFrontEnd\nutrizionista_front\` |
| **Backend** | Spring Boot 3, Java 17+, JPA/Hibernate | `app_nutrizione` | `c:\Users\Utente\Documents\GitHub\app_nutrizione\ProgettoNutrizionista\` |
| **Database** | TiDB Cloud (MySQL-compatible) | — | `spring.jpa.hibernate.ddl-auto=update` → Hibernate crea/modifica tabelle automaticamente |

**Frontend** gira su `http://localhost:4200` (`ng serve`)  
**Backend** gira su `http://localhost:8080`  
CORS configurato con `@CrossOrigin(origins = "http://localhost:4200")`

---

## Struttura Chiave Backend

```
src/main/java/it/nutrizionista/restnutrizionista/
├── controller/
│   └── AlimentoBaseController.java    → @RequestMapping("/api/alimenti_base")
├── service/
│   └── AlimentoBaseService.java       → logica business, getCurrentUtente()
├── repository/
│   ├── AlimentoBaseRepository.java    → JpaRepository + query custom
│   └── UtenteRepository.java         → findByEmail(), findWithAuthoritiesByEmail()
├── entity/
│   ├── AlimentoBase.java             → alimenti_base (con createdBy → Utente)
│   ├── Utente.java                   → utenti (con ruolo → Ruolo)
│   ├── Macro.java                    → macro (1:1 con AlimentoBase)
│   ├── AlimentoPasto.java            → alimenti_pasto (alimento in un pasto di una scheda)
│   └── Ruolo.java, Permesso.java, RuoloPermesso.java
├── dto/
│   ├── AlimentoBaseDto.java          → include boolean personale
│   ├── AlimentoBaseFormDto.java       → form per creazione/modifica
│   └── PageResponse.java             → wrapper paginazione
├── mapper/
│   └── DtoMapper.java                → ~1300 righe, metodi statici toXxxDto/toXxx
└── config/
    └── SecurityConfig.java           → JWT + @PreAuthorize
```

## Struttura Chiave Frontend

```
src/app/
├── screens/
│   └── alimenti-page/
│       ├── alimenti-page.ts          → ~850 righe, componente principale catalogo
│       ├── alimenti-page.html        → template con cards, modal, filtri
│       └── alimenti-page.css         → ~1700 righe, stili + dark mode
├── services/
│   └── alimento-service.ts           → HttpClient wrapper per /api/alimenti_base
├── dto/
│   ├── alimento-base.dto.ts          → AlimentoBaseDto, AlimentoBaseFormDto
│   └── page-response.dto.ts          → PageResponse<T>
└── components/
    └── scheda-dieta/                 → gestione schede dieta (piani alimentari)
```

---

## Autenticazione & Autorizzazione

- **JWT**: token nell'header `Authorization: Bearer <token>`
- **SecurityContext**: `SecurityContextHolder.getContext().getAuthentication().getName()` restituisce l'email dell'utente
- **Pattern per ottenere l'utente corrente** (già implementato in `AlimentoBaseService`):
```java
private Utente getCurrentUtente() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    return utenteRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utente non trovato"));
}
```
- **Permessi**: tabella `permessi` with alias (es. `ALIMENTO_READ`, `ALIMENTO_CREATE`), collegati ai ruoli tramite `ruoli_permessi`
- **Uso**: `@PreAuthorize("hasAuthority('NOME_PERMESSO')")` sui controller

### Ruoli nel DB
| ID | Nome | Note |
|----|------|------|
| 1 | Admin | Tutti i permessi |
| 2 | Nutrizionista | Permessi limitati, include `ALIMENTO_PERSONALE_CREATE` |

---

## Entità `Utente` (tabella `utenti`)

```java
@Entity @Table(name = "utenti")
public class Utente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome, cognome, codiceFiscale, email, password, telefono, indirizzo;
    private LocalDate dataNascita;
    private String filePathLogo;
    @ManyToOne @JoinColumn(name = "ruolo_id")
    private Ruolo ruolo;
    @OneToMany(mappedBy = "nutrizionista")
    private List<Cliente> clienti;
    private Instant createdAt, updatedAt;
}
```

## Entità `AlimentoBase` (tabella `alimenti_base`)

```java
@Entity @Table(name = "alimenti_base")
public class AlimentoBase {
    @Id @GeneratedValue private Long id;
    private String nome;             // unique
    private String categoria;        // es. "Carne", "Verdura"
    private Double misuraInGrammi;   // default 100g
    private String urlImmagine;
    @OneToOne(mappedBy = "alimento", cascade = ALL)
    private Macro macroNutrienti;    // calorie, proteine, carboidrati, grassi, fibre, ...
    @OneToMany(mappedBy = "alimento", cascade = ALL, orphanRemoval = true)
    private Set<ValoreMicro> micronutrienti;
    @ElementCollection private Set<String> tracce;
    
    /** null = globale (Admin), valorizzato = privato del nutrizionista */
    @ManyToOne(fetch = LAZY) @JoinColumn(name = "created_by")
    private Utente createdBy;
    
    private Instant createdAt, updatedAt;
}
```

---

## API Endpoints Attuali (`/api/alimenti_base`)

| Metodo | Endpoint | Permesso | Descrizione |
|--------|----------|----------|-------------|
| GET | `/` | `ALIMENTO_READ` | Lista paginata (filtrata per utente) |
| GET | `/search?query=X` | `ALIMENTO_READ` | Ricerca per nome (filtrata per utente) |
| GET | `/categorie` | `ALIMENTO_READ` | Categorie distinte (filtrate per utente) |
| GET | `/{id}` | `ALIMENTO_READ` | Dettaglio singolo |
| GET | `/{id}/dettaglio` | `ALIMENTO_READ` | Dettaglio completo (macro+micro+tracce) |
| GET | `/preferiti` | `ALIMENTO_READ` | Lista preferiti utente |
| POST | `/preferiti/{id}` | `ALIMENTO_READ` | Aggiungi ai preferiti |
| DELETE | `/preferiti/{id}` | `ALIMENTO_READ` | Rimuovi dai preferiti |
| GET | `/piu-utilizzati` | `ALIMENTO_READ` | Top alimenti usati nelle schede |
| POST | `/personale` | `ALIMENTO_PERSONALE_CREATE` | Crea personale (Nutrizionista) |
| DELETE | `/personale/{id}` | `ALIMENTO_PERSONALE_CREATE` | Elimina personale (con verifica ownership) |

---

## Cosa è stato completato

1.  **Visibilità per utente**: campo `createdBy` su `AlimentoBase`, tutte le query filtrate.
2.  **Due endpoint creazione**: `POST /` (Admin) e `POST /personale` (Nutrizionista).
3.  **Eliminazione sicura**: `DELETE /personale/{id}` con verifica ownership.
4.  **Flag `personale`**: boolean nel DTO per gestire UI condizionale.
5.  **Preferiti Server-Side**: migrati da `localStorage` a DB (`UtentePreferito`). Integrità UI mantenuta con `markForCheck()`.
6.  **Più Utilizzati Server-Side**: query su `alimenti_pasto` per statistiche reali di utilizzo.
7.  **Tab "I Miei Alimenti"**: sezione dedicata nel frontend per gestire i propri inserimenti.
8.  **Fix Change Detection**: risolti problemi di caricamento asincrono nel modal dettaglio e nella barra di ricerca.

---

## Cosa va implementato (Prossimi Step)

### 1. Pasti Personalizzati (Priorità Alta)

**Obiettivo**: Permettere al nutrizionista di creare "Template" di pasti (es. "Colazione Standard 300kcal") salvabili sul server e riutilizzabili velocemente nella creazione delle schede.

**Da implementare**:
- **Backend**: Nuova entità `PastoTemplate` (id, nome, descrizione, createdBy) e `PastoTemplateAlimento` (relazione con alimento e quantità).
- **API**: CRUD completo su `/api/pasti_template`.
- **Frontend**: Gestione nel tab "Pasti Personalizzati", aggiunta/rimozione alimenti dal template, calcolo macro totali.

---

## Note Tecniche Importanti

- **`ddl-auto=update`**: Hibernate aggiunge colonne/tabelle automaticamente. NON serve migration SQL per lo schema, MA serve per i dati (inserire permessi in `permessi` e `ruoli_permessi`)
- **CORS**: `@CrossOrigin(origins = "http://localhost:4200")` on every controller
- **DtoMapper**: classe statica con ~1300 righe di metodi `toXxxDto` / `toXxx`. Quando si aggiunge un campo al DTO, aggiornare anche il mapper
- **PageResponse<T>**: wrapper custom per la paginazione (`contenuto`, `totalePagine`, `numeroPagina`, `totaleElementi`)
- **Angular**: usa componenti standalone, `@for` blocks (nuova sintassi Angular 17+), `ChangeDetectionStrategy.Default` (con `markForCheck`/`detectChanges` manuali per caricamenti asincroni)
- **Observable pattern**: il catalogo usa rxjs `combineLatest([query$, page$, filterChanged$])` con `switchMap` per gestire ricerca/paginazione/filtri reattivamente
