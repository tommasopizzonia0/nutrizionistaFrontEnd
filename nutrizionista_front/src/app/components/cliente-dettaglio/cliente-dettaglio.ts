import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ClienteDto } from '../../dto/cliente.dto';
import { NavbarComponent } from '../navbar/navbar';
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft, faUser, faIdCard, faEnvelope, faPhone,
  faCalendar, faWeight, faRuler, faDumbbell, faHeartbeat,
  faRunning, faNotesMedical, faMale, faFemale, faEdit
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-cliente-dettaglio',
  standalone: true,
  imports: [CommonModule, FaIconComponent, FontAwesomeModule, NavbarComponent],
  templateUrl: './cliente-dettaglio.html',
  styleUrls: ['./cliente-dettaglio.css']
})
export class ClienteDettaglioComponent implements OnInit {

  cliente: ClienteDto | null = null;
  isLoading = true;
  isDarkMode = false;
  isSidebarCollapsed = true;

  // Icone
  faArrowLeft: IconProp = faArrowLeft;
  faUser: IconProp = faUser;
  faIdCard: IconProp = faIdCard;
  faEnvelope: IconProp = faEnvelope;
  faPhone: IconProp = faPhone;
  faCalendar: IconProp = faCalendar;
  faWeight: IconProp = faWeight;
  faRuler: IconProp = faRuler;
  faDumbbell: IconProp = faDumbbell;
  faHeartbeat: IconProp = faHeartbeat;
  faRunning: IconProp = faRunning;
  faNotesMedical: IconProp = faNotesMedical;
  faMale: IconProp = faMale;
  faFemale: IconProp = faFemale;
  faEdit: IconProp = faEdit;

  get sessoClass(): string {
    if (!this.cliente) return 'maschio';
    return this.cliente.sesso === 'Maschio' ? 'maschio' : 'femmina';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.caricaDettaglio(id);
    } else {
      this.router.navigate(['/clienti']);
    }

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

  caricaDettaglio(id: number): void {
    this.isLoading = true;
    this.clienteService.dettaglio(id).subscribe({
      next: (cliente) => {
        console.log('Cliente caricato:', cliente);
        console.log('Sesso:', cliente.sesso);
        this.cliente = cliente;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Errore nel caricamento del cliente:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/clienti']);
      }
    });
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