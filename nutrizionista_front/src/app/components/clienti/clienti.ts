import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { ClienteDto, ClienteFormDto } from '../../dto/cliente.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { NavbarComponent } from '../navbar/navbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faUserGroup, faPlus, faMale, faFemale, faEye, faEdit, faTrash,
  faChevronLeft, faChevronRight, faUserPlus, faTimes, faSave,
  faIdCard, faHeartbeat, faRunning, faNotesMedical, 
} from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './clienti.html',
  styleUrls: ['./clienti.css']
})
export class ClienteComponent implements OnInit {

  clienti: ClienteDto[] = [];
  clienteSelezionato: ClienteDto | null = null;

  modalAperta = false;
  modalDettaglio = false;
  isEdit = false;

  currentPage = 0;
  pageSize = 12;
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
  faIdCard: IconProp = faIdCard;
  faHeartbeat: IconProp = faHeartbeat;
  faRunning: IconProp = faRunning;
  faNotesMedical: IconProp = faNotesMedical;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public themeService: ThemeService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.caricaClienti();
  }

  caricaClienti(): void {
    this.clienteService.allMyClienti(this.currentPage, this.pageSize).subscribe({
      next: (response: PageResponse<ClienteDto>) => {
        this.clienti = response.contenuto;
        this.totalPages = response.totalePagine;
        this.totalElements = response.totaleElementi;
        this.cdr.detectChanges();
      }
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
    const call = this.isEdit
      ? this.clienteService.update(this.nuovoCliente)
      : this.clienteService.create(this.nuovoCliente);

    call.subscribe(() => {
      this.caricaClienti();
      this.chiudiModal();
    });
  }

  visualizzaDettaglio(id: number): void {
    this.router.navigate(['/clienti', id]);
  }

  eliminaCliente(id: number): void {
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) return;

    this.clienteService.deleteMyCliente(id).subscribe(() => {
      this.caricaClienti();
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

  private resetNuovoCliente(): ClienteFormDto {
    return {
      sesso: 'Maschio',
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
