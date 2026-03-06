import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ClienteService } from '../../services/cliente.service';
import { CalcoloTdeeService } from '../../services/calcolo-tdee.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { CalcoloTdeeDto, CalcoloTdeeFormDto } from '../../dto/calcolo-tdee.dto';

@Component({
  selector: 'app-calcolo-tdee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calcolo-tdee.html',
  styleUrls: ['./calcolo-tdee.css']
})
export class CalcoloTdeeComponent implements OnInit {
  
  clienti: ClienteDto[] = [];
  clienteSelezionatoId: number | null = null;

  dati: Partial<CalcoloTdeeFormDto> = {
    sesso: 'M',
    livelloAttivita: 1.2
  };

  risultatoAttuale: CalcoloTdeeDto | null = null;
  storicoValutazioni: CalcoloTdeeDto[] = [];
  
  loadingClienti = true;

  constructor(
    public themeService: ThemeService,
    private clienteService: ClienteService,
    private tdeeService: CalcoloTdeeService
  ) {}

  ngOnInit(): void {
    this.caricaClienti();
  }

  caricaClienti(): void {
    this.clienteService.allMyClienti(0, 1000).subscribe({
      next: (res: any) => {
        this.clienti = res.contenuto || [];
        this.loadingClienti = false;
      }
    });
  }

  onClienteChange(): void {
    if (this.clienteSelezionatoId) {
      
      // Facciamo una fetch del dettaglio completo del cliente per assicurarci di avere peso e altezza
      this.clienteService.dettaglio(this.clienteSelezionatoId).subscribe({
        next: (clienteCompleto) => {
          // 1. Sesso
          this.dati.sesso = (clienteCompleto.sesso?.toUpperCase() === 'FEMMINA' || clienteCompleto.sesso?.toUpperCase() === 'F') ? 'F' : 'M';
          
          // 2. Peso e Altezza (usiamo undefined invece di null per rispettare i tipi di TypeScript)
          this.dati.peso = clienteCompleto.peso ? clienteCompleto.peso : undefined;
          this.dati.altezza = clienteCompleto.altezza ? clienteCompleto.altezza : undefined;
          
          // 3. Calcolo automatico dell'età
          if (clienteCompleto.dataNascita) {
            const birthDate = new Date(clienteCompleto.dataNascita);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            this.dati.eta = Math.abs(ageDate.getUTCFullYear() - 1970);
          } else {
            this.dati.eta = undefined; // Anche qui undefined
          }
        },
        error: (err) => console.error("Errore nel caricamento del dettaglio cliente", err)
      });

      // Carica lo storico dei vecchi calcoli salvati nel DB
      this.caricaStorico();
      this.risultatoAttuale = null; 
      
    } else {
      this.resetForm();
    }
  }

  caricaStorico(): void {
    if (!this.clienteSelezionatoId) return;
    this.tdeeService.getStoricoCliente(this.clienteSelezionatoId).subscribe({
      next: (storico) => this.storicoValutazioni = storico
    });
  }

  calcolaTdee(): void {
    if (!this.clienteSelezionatoId) {
      alert("Per favore, seleziona un paziente prima di effettuare il calcolo.");
      return;
    }

    if (!this.dati.eta || !this.dati.peso || !this.dati.altezza || !this.dati.livelloAttivita) {
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

    // Chiama il backend, che farà il calcolo e salverà a DB
    this.tdeeService.calcolaESalva(form).subscribe({
      next: (risultatoDto) => {
        this.risultatoAttuale = risultatoDto;
        this.caricaStorico(); // Ricarica lo storico per includere il calcolo appena fatto
      },
      error: (err) => alert("Si è verificato un errore nel calcolo.")
    });
  }

  eliminaDalStorico(id: number): void {
    if (confirm("Sei sicuro di voler eliminare questo calcolo dallo storico?")) {
      this.tdeeService.eliminaCalcolo(id).subscribe({
        next: () => {
          this.caricaStorico();
          if (this.risultatoAttuale?.id === id) {
            this.risultatoAttuale = null;
          }
        }
      });
    }
  }

  resetForm(): void {
    this.clienteSelezionatoId = null;
    this.dati = { sesso: 'M', livelloAttivita: 1.2 };
    this.risultatoAttuale = null;
    this.storicoValutazioni = [];
  }
}