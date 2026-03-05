import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-ufficio',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './ufficio.html',
  styleUrls: ['./ufficio.css']
})
export class UfficioComponent implements OnInit {
  // Oggetto per memorizzare le statistiche
  stats = {
    clientiAttivi: 0,
    uomini: 0,
    donne: 0,
    schedeTotali: 0
  };
  
  // Stato del caricamento (inizia a true per mostrare la GIF)
  loading = true;

  // --- CONFIGURAZIONE GRAFICO A CIAMBELLA ---
  public doughnutChartLabels: string[] = ['Uomini', 'Donne'];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [{ data: [0, 0] }] // Inizialmente vuoto
  };
  public doughnutChartType: ChartType = 'doughnut';
  
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      }
    }
  };

  constructor(
    private clienteService: ClienteService,
    public themeService: ThemeService,
    public sidebarService: SidebarService,
    private cdr: ChangeDetectorRef // Necessario per forzare l'aggiornamento della vista
  ) {}

  ngOnInit(): void {
    this.caricaStatistiche();
  }

  caricaStatistiche(): void {
    this.loading = true;
    
    // Richiediamo una pagina molto grande (1000) per assicurarci di avere i dati di tutti i clienti
    this.clienteService.allMyClienti(0, 1000).subscribe({
      next: (response: PageResponse<ClienteDto>) => {
        
        // 1. Assegniamo il totale dei clienti presi dalla risposta impaginata
        this.stats.clientiAttivi = response.totaleElementi;

        // 2. Estraiamo l'array dei clienti
        const listaClienti = response.contenuto || [];
        
        // 3. Calcoliamo quanti uomini e donne ci sono
        this.stats.uomini = listaClienti.filter(c => 
          c.sesso?.toLowerCase() === 'maschio' || c.sesso?.toLowerCase() === 'm'
        ).length;
        
        this.stats.donne = listaClienti.filter(c => 
          c.sesso?.toLowerCase() === 'femmina' || c.sesso?.toLowerCase() === 'f'
        ).length;

        // 4. Aggiorniamo i dati del grafico
        this.doughnutChartData = {
          labels: this.doughnutChartLabels,
          datasets: [{ 
            data: [this.stats.uomini, this.stats.donne],
            backgroundColor: ['#3498db', '#e74c3c'], // Colori (Blu per Uomini, Rosso/Rosa per Donne)
            hoverBackgroundColor: ['#2980b9', '#c0392b'],
            borderWidth: 0
          }]
        };

        // 5. Placeholder per il numero di schede (in attesa di un endpoint dedicato)
        this.stats.schedeTotali = response.totaleElementi; 

        // 6. RITARDATORE: Aspettiamo 1.5 secondi prima di mostrare i dati 
        // per far sì che la GIF animata sia visibile all'utente.
        setTimeout(() => {
          this.loading = false;
          // Diciamo ad Angular di aggiornare l'HTML adesso
          this.cdr.detectChanges(); 
        }, 1500); 

      },
      error: (err) => {
        console.error("Errore nel caricamento delle statistiche dell'ufficio:", err);
        
        // Anche in caso di errore togliamo il caricamento dopo 1.5 secondi
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 1500);
      }
    });
  }
}