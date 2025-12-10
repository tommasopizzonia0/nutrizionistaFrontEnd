import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { ClienteDto, ClienteFormDto } from '../../dto/cliente.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { NavbarComponent } from '../navbar/navbar';
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
  imports: [CommonModule, FormsModule, FaIconComponent, FontAwesomeModule, NavbarComponent],
  templateUrl: './clienti.html',
  styleUrls: ['./clienti.css']
})
export class ClienteComponent implements OnInit {

  clienti: ClienteDto[] = [];
  clienteSelezionato: ClienteDto | null = null;

  isDarkMode = false;
  isSidebarCollapsed = true;

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

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.caricaClienti();
    }, 0);
  }

  onSidebarToggle(isCollapsed: boolean): void {
    setTimeout(() => {
      this.isSidebarCollapsed = isCollapsed;
      this.cdr.detectChanges();
    }, 0);
  }

  onThemeChange(isDark: boolean): void {
    setTimeout(() => {
      this.isDarkMode = isDark;
      this.cdr.detectChanges();
    }, 0);
  }

  caricaClienti(): void {
    this.clienteService.allMyClienti(this.currentPage, this.pageSize).subscribe({
      next: (response: PageResponse<ClienteDto>) => {
        this.clienti = response.contenuto;
        this.totalPages = response.totalePagine;
        this.totalElements = response.totaleElementi;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Errore nel caricamento dei clienti:', err)
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
      this.clienteService.update(this.nuovoCliente).subscribe({
        next: () => { 
          this.caricaClienti(); 
          this.chiudiModal(); 
        },
        error: (err) => console.error('Errore nella modifica del cliente:', err)
      });
    } else {
      this.clienteService.create(this.nuovoCliente).subscribe({
        next: () => { 
          this.caricaClienti(); 
          this.chiudiModal(); 
        },
        error: (err) => console.error('Errore nella creazione del cliente:', err)
      });
    }
  }

  visualizzaDettaglio(id: number): void {
    this.clienteService.dettaglio(id).subscribe({
      next: (cliente) => { 
        this.clienteSelezionato = cliente; 
        this.modalDettaglio = true; 
        document.body.style.overflow = 'hidden';
      },
      error: (err) => console.error('Errore nel caricamento del dettaglio:', err)
    });
  }

  eliminaCliente(id: number): void {
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) return;

    this.clienteService.deleteMyCliente(id).subscribe({
      next: () => this.caricaClienti(),
      error: (err) => console.error('Errore nell\'eliminazione del cliente:', err)
    });
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