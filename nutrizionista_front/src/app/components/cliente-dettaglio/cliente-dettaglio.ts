import { Component, OnInit, ChangeDetectorRef, Input, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// Services
import { ClienteService } from '../../services/cliente.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { SchedaService } from '../../services/scheda-service';

// DTOs
import { ClienteDto } from '../../dto/cliente.dto';
import { SchedaDto } from '../../dto/scheda.dto';

// Components
import { MisurazioneComponent } from '../misurazione/misurazione';
import { ListaMisurazioniComponent } from '../lista-misurazioni/lista-misurazioni';
import { ListaSchede } from '../lista-schede/lista-schede';
import { SchedaDietaComponent } from '../scheda-dieta/scheda-dieta';
import { AnteprimaSchedaComponent } from '../anteprima-scheda/anteprima-scheda';

// Icons
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft, faUser, faIdCard, faEnvelope, faPhone,
  faCalendar, faWeight, faRuler, faHeartbeat,
  faRunning, faEdit, faInfoCircle,
  faRulerVertical, faClipboardList, faPenRuler,
  faPercent
} from '@fortawesome/free-solid-svg-icons';
import { PlicometriaComponent } from '../plicometria/plicometria';

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
    ListaMisurazioniComponent,
    ListaSchede,
    SchedaDietaComponent,
    AnteprimaSchedaComponent,
    PlicometriaComponent
  ],
  templateUrl: './cliente-dettaglio.html',
  styleUrls: ['./cliente-dettaglio.css']
})
export class ClienteDettaglioComponent implements OnInit {

  @Input() cliente!: ClienteDto;
  @Input() clienteId!: number;

  // Riferimento al componente figlio ListaSchede per forzare il reload
  @ViewChild(ListaSchede) listaSchedeComponent!: ListaSchede;

  isLoading = true;
  vistaCorrente: string = 'info';
  haNuoveMisurazioni = false;

  // Stato per la selezione della dieta (undefined = mostra lista)
  schedaSelezionataId?: number;
  // Stato per anteprima (senza entrare in full screen)
  schedaPreview?: SchedaDto;

  navItems: NavItem[] = [];

  // Icone
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faUser = faUser;
  faRunning = faRunning;
  faHeartbeat = faHeartbeat;
  faInfoCircle = faInfoCircle;
  faRulerVertical = faRulerVertical;
  faClipboardList = faClipboardList;
  faPenRuler = faPenRuler;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faCalendar = faCalendar;
  faWeight = faWeight;
  faRuler = faRuler;
  faIdCard = faIdCard;
  faPercent= faPercent;

  // Inject services
  private schedaService = inject(SchedaService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    public themeService: ThemeService,
    public sidebarService: SidebarService,
    private cdr: ChangeDetectorRef
  ) { }

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
      { id: 'misurazioni', icon: faRulerVertical, label: 'Misurazioni Antropometriche', route: 'misurazioni' },
      { id: 'plicometria', icon: faPercent, label: 'Plicometria', route: 'plicometria' },
      { id: 'piano', icon: faClipboardList, label: 'Piano Alimentare', route: 'piano-alimentare' }
    ];
  }

  // --- HELPERS DATI CLIENTE ---

  get sessoClass(): string {
    const sesso = (this.cliente?.sesso ?? '').toLowerCase().trim();
    return sesso === 'maschio' ? 'maschio' : sesso === 'femmina' ? 'femmina' : '';
  }

  formatData(value?: string): string {
    if (!value) return 'Non disponibile';
    const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return isNaN(d.getTime()) ? 'Non disponibile' : d.toLocaleDateString('it-IT');
  }

  calcolaEta(value?: string): string {
    if (!value) return 'Non disponibile';
    const dob = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    if (isNaN(dob.getTime())) return 'Non disponibile';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} anni`;
  }

  get bmi(): number | null {
    if (!this.cliente?.peso || !this.cliente?.altezza) return null;
    const h = this.cliente.altezza / 100;
    return Math.round((this.cliente.peso / (h * h)) * 10) / 10;
  }

  get bmiCategoria(): any {
    const b = this.bmi;
    if (b == null) return null;
    if (b < 18.5) return { label: 'Sottopeso', key: 'under' };
    if (b < 25) return { label: 'Normopeso', key: 'normal' };
    if (b < 30) return { label: 'Sovrappeso', key: 'over' };
    return { label: 'Obesità', key: 'obese' };
  }

  get bmiPercent(): number {
    const b = this.bmi;
    if (b == null) return 0;
    return ((Math.min(30, Math.max(18.5, b)) - 18.5) / (30 - 18.5)) * 100;
  }

  // --- NAVIGAZIONE ---

  navigaTo(route: string): void {
    this.vistaCorrente = route;
    if (route === 'misurazioni') {
      this.haNuoveMisurazioni = false;
    }
    // Se torno al tab piano, resetto la vista lista
    if (route === 'piano-alimentare') {
      // Opzionale: decommenta se vuoi tornare sempre alla lista quando clicchi il tab
      // this.schedaSelezionataId = undefined;
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

  tornaIndietro(): void {
    this.router.navigate(['/clienti']);
  }

  modificaCliente(): void {
    if (this.cliente?.id) {
      this.router.navigate(['/clienti'], { queryParams: { edit: this.cliente.id } });
    }
  }

  // --- LOGICA MISURAZIONI ---

  onMisurazioneSalvata(): void {
    this.haNuoveMisurazioni = true;
  }

  // --- LOGICA PIANO ALIMENTARE ---

  onSchedaSelezionata(scheda: SchedaDto): void {
    // Cliccando matita, attivo la vista modifica full screen
    this.schedaPreview = undefined;
    this.schedaSelezionataId = scheda.id;
  }

  onPreviewScheda(scheda: SchedaDto): void {
    // Cliccando riga, mostro anteprima nel pannello destro
    this.schedaPreview = scheda;
  }

  chiudiPreview(): void {
    this.schedaPreview = undefined;
  }

  onRichiestaNuovaScheda(): void {
    // 1. Prepariamo l'oggetto (data e nome) - nuova scheda sempre attiva
    const nuovaScheda = {
      cliente: { id: this.clienteId },
      nome: 'Nuova Dieta ' + new Date().toLocaleDateString('it-IT'),
      attiva: true  // Nuova scheda diventa automaticamente attiva
    };

    this.schedaService.create(nuovaScheda as any).subscribe({
      next: (schedaCreata) => {
        // 2. Aggiorniamo la lista in background (così se torni indietro la trovi già)
        if (this.listaSchedeComponent) {
          this.listaSchedeComponent.loadSchede();
        }

        // 3. Impostiamo l'ID per passare alla vista dettaglio
        this.schedaSelezionataId = schedaCreata.id;

        // --- FIX FONDAMENTALE ---
        // Forziamo Angular a "disegnare" subito il componente dettaglio
        // perché siamo dentro una chiamata asincrona
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Errore creazione scheda', err)
    });
  }
  // Metodo per il pulsante "Torna allo storico"
  tornaAllaLista(): void {
    this.schedaSelezionataId = undefined;
    this.schedaPreview = undefined;
    // Ricarica la lista per mostrare eventuali modifiche (es. nome o data ultima modifica)
    // Nota: usando @if nel template, il componente ListaSchede viene distrutto e ricreato, 
    // quindi si ricaricherà da solo tramite ngOnInit/ngOnChanges.
  }

}