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
  ) { }

  ngOnInit(): void {
    this.caricaStatistiche();
  }

caricaStatistiche(): void {
  this.loading = true;
  
  // Usiamo il nuovo metodo che restituisce TUTTA la lista senza paginazione
  this.clienteService.listaCompleta().subscribe({
    next: (listaClienti: ClienteDto[]) => {
      
      // 1. Il totale clienti è semplicemente la lunghezza dell'array
      this.stats.clientiAttivi = listaClienti.length;

      // 2. Calcoliamo quanti uomini e donne ci sono con il .trim() sicuro
      this.stats.uomini = listaClienti.filter(c => {
        const sesso = (c.sesso ?? '').toLowerCase().trim();
        return sesso === 'maschio' || sesso === 'm';
      }).length;
      
      this.stats.donne = listaClienti.filter(c => {
        const sesso = (c.sesso ?? '').toLowerCase().trim();
        return sesso === 'femmina' || sesso === 'f';
      }).length;

      // 3. Aggiorniamo i dati del grafico
      this.doughnutChartData = {
        labels: this.doughnutChartLabels,
        datasets: [{ 
          data: [this.stats.uomini, this.stats.donne],
          backgroundColor: ['#3498db', '#e74c3c'],
          hoverBackgroundColor: ['#2980b9', '#c0392b'],
          borderWidth: 0
        }]
      };

      // 4. Placeholder per il numero di schede
      this.stats.schedeTotali = listaClienti.length; 

      // 5. RITARDATORE per mostrare la GIF
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges(); 
      }, 1500); 

    },
    error: (err) => {
      console.error("Errore nel caricamento delle statistiche dell'ufficio:", err);
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 1500);
    }
  });
}
}