import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; 
import {
  faUser, faWeight, faBolt, faBullseye, faArrowRight, faCalculator, faTint, faUtensils, faHistory,
  faTimes, faSearch, faInfoCircle
} from '@fortawesome/free-solid-svg-icons'; 

import { ThemeService } from '../../services/theme.service';
import { ClienteService } from '../../services/cliente.service';
import { CalcoloTdeeService } from '../../services/calcolo-tdee.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { CalcoloTdeeDto, CalcoloTdeeFormDto } from '../../dto/calcolo-tdee.dto';
import { SidebarService } from '../../services/navbar.service';

@Component({
  selector: 'app-calcolo-tdee',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule], 
  templateUrl: './calcolo-tdee.html',
  styleUrls: ['./calcolo-tdee.css']
})
export class CalcoloTdeeComponent implements OnInit {
  
  faUser = faUser;
  faWeight = faWeight;
  faBolt = faBolt;
  faBullseye = faBullseye;
  faArrowRight = faArrowRight;
  faCalculator = faCalculator;
  faTint = faTint;
  faUtensils = faUtensils;
  faHistory = faHistory; 
  faTimes = faTimes;
  faSearch = faSearch; // <-- Aggiunto per l'input di ricerca
  faInfoCircle = faInfoCircle;

  clienti: ClienteDto[] = [];
  clienteSelezionatoId: number | null = null;

  // --- NUOVO: Variabili per Autocomplete Ricerca Paziente ---
  searchQuery: string = '';
  clientiFiltratiSearch: ClienteDto[] = []; 
  mostraDropdown: boolean = false;
  isCalculating: boolean = false;

  dati: Partial<CalcoloTdeeFormDto> = { sesso: 'M', livelloAttivita: 1.2 };
  risultatoAttuale: CalcoloTdeeDto | null = null;
  storicoValutazioni: CalcoloTdeeDto[] = [];
  ultimiCalcoli: CalcoloTdeeDto[] = [];
  loadingClienti = true;

  constructor(
    public themeService: ThemeService,
    private clienteService: ClienteService,
    private tdeeService: CalcoloTdeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.caricaClienti();
    this.caricaUltimiCalcoli(); 
  }

caricaClienti(): void {
    // Usiamo il nuovo endpoint senza limiti di paginazione
    this.clienteService.listaCompleta().subscribe({
      next: (res: ClienteDto[]) => {
        // res ora è direttamente l'array dei clienti, non più res.contenuto
        this.clienti = res || [];
        this.clientiFiltratiSearch = [...this.clienti]; 
        this.loadingClienti = false;
        this.cdr.detectChanges(); 
        
        // Controllo se c'è un clienteId nei parametri dell'URL
        this.route.queryParams.subscribe(params => {
          const cid = params['clienteId'];
          if (cid) {
            const parsedId = Number(cid);
            const clienteTrovato = this.clienti.find(c => c.id === parsedId);
            if (clienteTrovato) {
              this.searchQuery = `${clienteTrovato.nome} ${clienteTrovato.cognome}`;
              this.clienteSelezionatoId = parsedId;
              this.onClienteChange(); 
            }
          }
        });
      },
      error: (err) => {
        console.error("Errore nel caricamento della lista clienti", err);
        this.loadingClienti = false;
      }
    });
  }

  caricaUltimiCalcoli(): void {
    this.tdeeService.getUltimiCalcoli().subscribe({
      next: (calcoli) => {
        this.ultimiCalcoli = calcoli;
        this.cdr.detectChanges();
      }
    });
  }

  onClienteChange(): void {
    if (this.clienteSelezionatoId) {
      this.clienteService.dettaglio(this.clienteSelezionatoId).subscribe({
        next: (clienteCompleto) => {
          this.dati.sesso = (clienteCompleto.sesso?.toUpperCase() === 'FEMMINA' || clienteCompleto.sesso?.toUpperCase() === 'F') ? 'F' : 'M';
          this.dati.peso = clienteCompleto.peso ? clienteCompleto.peso : undefined;
          this.dati.altezza = clienteCompleto.altezza ? clienteCompleto.altezza : undefined;
          
          if (clienteCompleto.dataNascita) {
            const birthDate = new Date(clienteCompleto.dataNascita);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            this.dati.eta = Math.abs(ageDate.getUTCFullYear() - 1970);
          } else {
            this.dati.eta = undefined;
          }
          this.cdr.detectChanges(); 
        },
        error: (err) => console.error("Errore dettaglio cliente", err)
      });
      this.caricaStorico();
      this.risultatoAttuale = null; 
    } else {
      this.resetForm();
    }
  }

  caricaStorico(): void {
    if (!this.clienteSelezionatoId) return;
    this.tdeeService.getStoricoCliente(this.clienteSelezionatoId).subscribe({
      next: (storico) => {
        this.storicoValutazioni = storico;
        this.cdr.detectChanges();
      }
    });
  }

calcolaTdee(): void {
    if (!this.dati.eta || !this.dati.peso || !this.dati.altezza || !this.dati.livelloAttivita) {
      alert("Per favore, compila tutti i dati fisici prima di calcolare.");
      return;
    }

    // 1. Avvia l'animazione e nasconde i vecchi risultati
    this.isCalculating = true;
    this.risultatoAttuale = null;
    this.cdr.detectChanges();

    // 2. Simula un tempo di "macinazione dati" (800ms) per un effetto WOW
    setTimeout(() => {
      if (this.clienteSelezionatoId) {
        const form: CalcoloTdeeFormDto = {
          clienteId: this.clienteSelezionatoId,
          sesso: this.dati.sesso!,
          eta: Number(this.dati.eta),
          peso: Number(this.dati.peso),
          altezza: Number(this.dati.altezza),
          livelloAttivita: Number(this.dati.livelloAttivita)
        };

        this.tdeeService.calcolaESalva(form).subscribe({
          next: (risultatoDto) => {
            this.risultatoAttuale = risultatoDto;
            this.caricaStorico(); 
            this.caricaUltimiCalcoli(); 
            this.isCalculating = false; 
            this.cdr.detectChanges(); 
          },
          error: () => {
            alert("Si è verificato un errore nel salvataggio del calcolo.");
            this.isCalculating = false;
            this.cdr.detectChanges();
          }
        });
      } else {
        this.effettuaCalcoloManuale();
      }
    }, 1200); 
  }

  effettuaCalcoloManuale(): void {
    const p = Number(this.dati.peso);
    const a = Number(this.dati.altezza);
    const e = Number(this.dati.eta);
    const laf = Number(this.dati.livelloAttivita);
    const isUomo = this.dati.sesso === 'M';

    let bmr = (10 * p) + (6.25 * a) - (5 * e);
    bmr = isUomo ? bmr + 5 : bmr - 161;
    
    const tdee = Math.round(bmr * laf);

    this.risultatoAttuale = {
      bmr: Math.round(bmr),
      tdee: tdee,
      tdeeSettimanale: tdee * 7,
      fabbisognoIdrico: parseFloat((p * 0.03).toFixed(1)), 
      calorieDimagrimento: tdee - 500,
      calorieMassa: tdee + 300,
      peso: p
    } as CalcoloTdeeDto;

    this.isCalculating = false; // Ferma l'animazione anche nel calcolo manuale
    this.cdr.detectChanges();
  }

  pulisciRicerca() {
    this.clienteSelezionatoId = null;
    this.searchQuery = '';
    this.mostraDropdown = false;
    this.clientiFiltratiSearch = [...this.clienti];
    this.resetForm(); 
  }

  eliminaDalStorico(id: number): void {
    if (confirm("Sei sicuro di voler eliminare questo calcolo?")) {
      this.tdeeService.eliminaCalcolo(id).subscribe({
        next: () => {
          this.caricaStorico();
          this.caricaUltimiCalcoli(); 
          if (this.risultatoAttuale?.id === id) this.risultatoAttuale = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

  resetForm(): void {
    this.clienteSelezionatoId = null;
    this.dati = { sesso: 'M', livelloAttivita: 1.2 };
    this.risultatoAttuale = null;
    this.storicoValutazioni = [];
    this.searchQuery = ''; // <-- Pulisci anche la barra di ricerca
    this.cdr.detectChanges();
  }

  vaiAInfoCliente(): void {
    if (this.clienteSelezionatoId && this.risultatoAttuale?.id) {
      this.vaiAInfoClienteDaStorico(this.clienteSelezionatoId, this.risultatoAttuale.id);
    }
  }

  vaiAInfoClienteDaStorico(clienteId: number, tdeeId: number): void {
    this.router.navigate(['/clienti', clienteId], {
      queryParams: { tdeeId: tdeeId }
    });
  }

  getNomeCliente(clienteId: number): string {
    const c = this.clienti.find(x => x.id === clienteId);
    return c ? `${c.nome} ${c.cognome}` : 'Paziente Sconosciuto';
  }

  // =========================================================
  // LOGICA RICERCA AUTOCOMPLETE
  // =========================================================

  filtraClienti() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.clientiFiltratiSearch = [...this.clienti];
      return;
    }
    const term = this.searchQuery.toLowerCase().trim();
    this.clientiFiltratiSearch = this.clienti.filter(c => 
      c.nome?.toLowerCase().includes(term) || 
      c.cognome?.toLowerCase().includes(term) ||
      `${c.nome} ${c.cognome}`.toLowerCase().includes(term)
    );
  }

  selezionaCliente(cliente: ClienteDto) {
    this.clienteSelezionatoId = cliente.id ?? null;
    this.searchQuery = `${cliente.nome} ${cliente.cognome}`;
    this.mostraDropdown = false;
    this.onClienteChange(); 
  }


  nascondiDropdown() {
    // Timeout leggero per permettere il mousedown sul li prima che sparisca
    setTimeout(() => {
      this.mostraDropdown = false;
      this.cdr.detectChanges();
    }, 150);
  }

  // =========================================================
  // UTILS
  // =========================================================

  formatData(value?: string): string {
    if (!value) return '';
    const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('it-IT');
  }

  getMacro(tdee: number, peso: number) {
    if (!tdee || !peso) return null;
    
    const proG = Math.round(peso * 2.0);
    const proKcal = proG * 4;

    const fatMinG = Math.round(peso * 0.6);
    const fatMaxG = Math.round(peso * 1.2);
    const fatMinKcal = fatMinG * 9;
    const fatMaxKcal = fatMaxG * 9;

    const carbMinKcal = Math.max(0, tdee - proKcal - fatMaxKcal);
    const carbMaxKcal = Math.max(0, tdee - proKcal - fatMinKcal);
    
    const carbMinG = Math.round(carbMinKcal / 4);
    const carbMaxG = Math.round(carbMaxKcal / 4);

    return { 
      proG, proKcal, 
      fatMinG, fatMaxG, fatMinKcal, fatMaxKcal, 
      carbMinG, carbMaxG, carbMinKcal, carbMaxKcal 
    };
  }
}