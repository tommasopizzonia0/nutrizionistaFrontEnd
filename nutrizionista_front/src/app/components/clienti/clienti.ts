import { Component, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClienteDto, ClienteFormDto } from '../../dto/cliente.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { 
  faUserGroup, faPlus, faMale, faFemale, faEye, faEdit, faTrash, 
  faChevronLeft, faChevronRight, faUserPlus, faTimes, faSave, faUser, 
  faIdCard, faHeartbeat, faRunning, faNotesMedical 
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent, FontAwesomeModule, NavbarComponent  ],
  templateUrl: './clienti.html',
  styleUrls: ['./clienti.css'],
    
})
export class ClienteComponent implements OnInit {
  private apiUrl = 'http://localhost:8080/api/clienti';

  clienti: ClienteDto[] = [];
  clienteSelezionato: ClienteDto | null = null;

  isDarkMode: boolean = false; 

  isSidebarCollapsed: boolean = false;

  modalAperta = false;
  modalDettaglio = false;
  isEdit = false;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  nuovoCliente: ClienteFormDto = this.resetNuovoCliente();

  // Icone
  faUserGroup: IconProp = faUserGroup;
  faPlus: IconProp = faPlus;
  faMale: IconProp = faMale;
  faFemale: IconProp = faFemale;
  faEye: IconProp = faEye;
  faEdit: IconProp = faEdit;
  faTrash: IconProp = faTrash;
  faChevronLeft: IconProp = faChevronLeft;
  faChevronRight: IconProp = faChevronRight;
  faUserPlus: IconProp = faUserPlus;
  faTimes: IconProp = faTimes;
  faSave: IconProp = faSave;
  faUser: IconProp = faUser;
  faIdCard: IconProp = faIdCard;
  faHeartbeat: IconProp = faHeartbeat;
  faRunning: IconProp = faRunning;
  faNotesMedical: IconProp = faNotesMedical;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.caricaClienti();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  onSidebarToggle(isCollapsed: boolean) {
  this.isSidebarCollapsed = isCollapsed;
}

  caricaClienti(): void {
    const url = `${this.apiUrl}?page=${this.currentPage}&size=${this.pageSize}`;
    this.http.get<PageResponse<ClienteDto>>(url, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.clienti = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements;
        },
        error: (error) => console.error('Errore nel caricamento dei clienti:', error)
      });
  }

  apriModalCreazione(): void {
    this.isEdit = false;
    this.nuovoCliente = this.resetNuovoCliente();
    this.modalAperta = true;
    document.body.style.overflow = 'hidden';
  }

  apriModalModifica(cliente: ClienteDto): void {
    this.isEdit = true;
    this.nuovoCliente = { ...cliente };
    this.modalAperta = true;
    document.body.style.overflow = 'hidden';
  }

  chiudiModal(): void {
    this.modalAperta = false;
    this.modalDettaglio = false;
    this.clienteSelezionato = null;
    document.body.style.overflow = 'auto';
  }

  salvaCliente(): void {
    if (this.isEdit) {
      this.http.put<ClienteDto>(this.apiUrl, this.nuovoCliente, { headers: this.getHeaders() })
        .subscribe({
          next: () => { this.caricaClienti(); this.chiudiModal(); },
          error: (error) => console.error('Errore nella modifica del cliente:', error)
        });
    } else {
      this.http.post<ClienteDto>(this.apiUrl, this.nuovoCliente, { headers: this.getHeaders() })
        .subscribe({
          next: () => { this.caricaClienti(); this.chiudiModal(); },
          error: (error) => console.error('Errore nella creazione del cliente:', error)
        });
    }
  }

  visualizzaDettaglio(id: number): void {
    const url = `${this.apiUrl}/dettaglio`;
    this.http.get<ClienteDto>(url, { headers: this.getHeaders(), params: { id: id.toString() } })
      .subscribe({
        next: (cliente) => { 
          this.clienteSelezionato = cliente; 
          this.modalDettaglio = true; 
          document.body.style.overflow = 'hidden';
        },
        error: (error) => console.error('Errore nel caricamento del dettaglio:', error)
      });
  }

  eliminaCliente(id: number): void {
    if (confirm('Sei sicuro di voler eliminare questo cliente?')) {
      const url = `${this.apiUrl}/mio`;
      this.http.delete(url, { headers: this.getHeaders(), body: { id } })
        .subscribe({
          next: () => this.caricaClienti(),
          error: (error) => console.error('Errore nell\'eliminazione del cliente:', error)
        });
    }
  }

  cambiapagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.caricaClienti();
    }
  }

  get paginaCorrente(): number {
    return this.currentPage + 1;
  }


  clienteTrackBy(index: number, cliente: ClienteDto): number {
  return cliente.id!;
}


  onThemeChange(isDark: boolean): void {
    console.log('🎨 THEME CHANGE RECEIVED IN HOME');
    this.isDarkMode = isDark;
    // NON applicare più il tema al body - lascia che sia la navbar a gestirlo
    // this.applyThemeToBody(); // <-- COMMENTA O RIMUOVI QUESTA RIGA
    console.log('Tema ricevuto nel componente home:', isDark ? 'Dark' : 'Light');
  }

  // Rimuovi completamente questo metodo o lascialo vuoto
  applyThemeToBody(): void {
    // Non fare nulla qui - la navbar gestisce già il tema del body
    console.log('✅ Tema gestito dalla navbar');
  }





  private resetNuovoCliente(): ClienteFormDto {
    return {
      sesso: 'MASCHIO',
      nome: '',
      cognome: '',
      codiceFiscale: '',
      email: '',
      telefono: '',
      dataNascita: '',
      peso: 0,
      altezza: 0,
      numAllenamentiSett: '',
      intolleranze: '',
      funzioniIntestinali: '',
      problematicheSalutari: '',
      quantitaEQualitaDelSonno: '',
      assunzioneFarmaci: '',
      beveAlcol: false
    };
  }
}
