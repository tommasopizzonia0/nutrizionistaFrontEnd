import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; 
import {
  faUser, faWeight, faBolt, faBullseye, faArrowRight, faCalculator, faTint, faUtensils, faHistory
} from '@fortawesome/free-solid-svg-icons'; 

import { ThemeService } from '../../services/theme.service';
import { ClienteService } from '../../services/cliente.service';
import { CalcoloTdeeService } from '../../services/calcolo-tdee.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { CalcoloTdeeDto, CalcoloTdeeFormDto } from '../../dto/calcolo-tdee.dto';

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
  faHistory = faHistory; // <-- Icona cronologia

  clienti: ClienteDto[] = [];
  clienteSelezionatoId: number | null = null;

  dati: Partial<CalcoloTdeeFormDto> = { sesso: 'M', livelloAttivita: 1.2 };
  risultatoAttuale: CalcoloTdeeDto | null = null;
  storicoValutazioni: CalcoloTdeeDto[] = [];
  ultimiCalcoli: CalcoloTdeeDto[] = []; // <-- Nuova variabile
  loadingClienti = true;

  constructor(
    public themeService: ThemeService,
    private clienteService: ClienteService,
    private tdeeService: CalcoloTdeeService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.caricaClienti();
    this.caricaUltimiCalcoli(); // Carica subito la cronologia globale
  }

  caricaClienti(): void {
    this.clienteService.allMyClienti(0, 1000).subscribe({
      next: (res: any) => {
        this.clienti = res.contenuto || [];
        this.loadingClienti = false;
        this.cdr.detectChanges(); 
        
        this.route.queryParams.subscribe(params => {
          const cid = params['clienteId'];
          if (cid) {
            const parsedId = Number(cid);
            if (this.clienti.some(c => c.id === parsedId)) {
              this.clienteSelezionatoId = parsedId;
              this.onClienteChange(); 
            }
          }
        });
      }
    });
  }

  // --- NUOVO: Carica gli ultimi calcoli di tutti i pazienti ---
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
    if (!this.clienteSelezionatoId || !this.dati.eta || !this.dati.peso || !this.dati.altezza || !this.dati.livelloAttivita) {
      alert("Per favore, compila tutti i campi prima di calcolare.");
      return;
    }

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
        this.caricaUltimiCalcoli(); // Aggiorna anche la lista globale
        this.cdr.detectChanges(); 
      },
      error: () => alert("Si è verificato un errore nel calcolo.")
    });
  }

  eliminaDalStorico(id: number): void {
    if (confirm("Sei sicuro di voler eliminare questo calcolo?")) {
      this.tdeeService.eliminaCalcolo(id).subscribe({
        next: () => {
          this.caricaStorico();
          this.caricaUltimiCalcoli(); // Aggiorna anche la lista globale
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
    this.cdr.detectChanges();
  }

  vaiAInfoCliente(): void {
    if (this.clienteSelezionatoId && this.risultatoAttuale?.id) {
      this.vaiAInfoClienteDaStorico(this.clienteSelezionatoId, this.risultatoAttuale.id);
    }
  }

  // --- NUOVO: Navigazione dallo storico globale ---
  vaiAInfoClienteDaStorico(clienteId: number, tdeeId: number): void {
    this.router.navigate(['/clienti', clienteId], {
      queryParams: { tdeeId: tdeeId }
    });
  }

  // --- NUOVO: Ricerca il nome del cliente per la lista ---
  getNomeCliente(clienteId: number): string {
    const c = this.clienti.find(x => x.id === clienteId);
    return c ? `${c.nome} ${c.cognome}` : 'Paziente Sconosciuto';
  }

  // Formatta la data
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