import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { NavbarComponent } from '../navbar/navbar';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { MisurazioneComponent } from '../misurazione/misurazione';
import { ListaMisurazioniComponent } from '../lista-misurazioni/lista-misurazioni';

import {
  faArrowLeft, faUser, faIdCard, faEnvelope, faPhone,
  faCalendar, faWeight, faRuler, faDumbbell, faHeartbeat,
  faRunning, faNotesMedical, faEdit, faInfoCircle,
  faRulerVertical, faClipboardList, faPenRuler
} from '@fortawesome/free-solid-svg-icons';

interface NavItem {
  id: string;
  icon: IconProp;
  label: string;
  route: string;
}

@Component({
  selector: 'app-cliente-dettaglio',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    FontAwesomeModule,
    MisurazioneComponent,
    ListaMisurazioniComponent 
  ],
  templateUrl: './cliente-dettaglio.html',
  styleUrls: ['./cliente-dettaglio.css']
})
export class ClienteDettaglioComponent implements OnInit {

  cliente: ClienteDto | null = null;
  clienteId!: number;
  isLoading = true;

  vistaCorrente: string = 'info';
  haNuoveMisurazioni = false;

  navItems: NavItem[] = [];

  // Icone
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faUser = faUser;
  faRunning = faRunning;
  faHeartbeat = faHeartbeat;
  faNotesMedical = faNotesMedical;
  faInfoCircle = faInfoCircle;
  faRulerVertical = faRulerVertical;
  faClipboardList = faClipboardList;
  faPenRuler = faPenRuler;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    public themeService: ThemeService,
    public sidebarService: SidebarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.router.navigate(['/clienti']);
      return;
    }

    this.clienteId = id;
    this.inizializzaNavItems();
    this.caricaDettaglio(id);
  }

  inizializzaNavItems(): void {
    this.navItems = [
      { id: 'info', icon: faInfoCircle, label: 'Info', route: 'info' },
      { id: 'nuova-misurazione', icon: faPenRuler, label: 'Nuova Misurazione', route: 'nuova-misurazione' },
      { id: 'misurazioni', icon: faRulerVertical, label: 'Misurazioni', route: 'misurazioni' },
      { id: 'piano', icon: faClipboardList, label: 'Piano Alimentare', route: 'piano-alimentare' }
    ];
  }

  get sessoClass(): string {
    if (!this.cliente) return '';
    return this.cliente.sesso === 'Maschio' ? 'maschio' : 'femmina';
  }

  navigaTo(route: string): void {
    this.vistaCorrente = route;
    if (route === 'misurazioni') {
      this.haNuoveMisurazioni = false;
    }
  }

  isActiveRoute(route: string): boolean {
    return this.vistaCorrente === route;
  }

  caricaDettaglio(id: number): void {
    this.isLoading = true;

    this.clienteService.dettaglio(id).subscribe({
      next: cliente => {
        this.cliente = cliente;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.router.navigate(['/clienti']);
      }
    });
  }

  onMisurazioneSalvata(): void {
    this.haNuoveMisurazioni = true;
  }

  tornaIndietro(): void {
    this.router.navigate(['/clienti']);
  }

  modificaCliente(): void {
    if (this.cliente?.id) {
      this.router.navigate(['/clienti'], {
        queryParams: { edit: this.cliente.id }
      });
    }
  }
}
