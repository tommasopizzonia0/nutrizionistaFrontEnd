import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, forkJoin } from 'rxjs'; // Aggiunto forkJoin
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  faUser, faEnvelope, faPhone, faCalendar, faIdCard,
  faWeight, faRuler, faPercentage, faDumbbell,
  faRulerCombined, faBullseye, faClipboardList, faRunning,
  faHeartbeat, faBolt, faTrash, faChevronDown, faChevronUp, faUtensils,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import { ClienteDto } from '../../dto/cliente.dto';
import { PlicometrieApiService } from '../../services/plicometria.service';
import { MisurazioneAntropometricaService } from '../../services/misurazione-antropometrica.service';
import { SchedaService } from '../../services/scheda-service';
import { CalcoloTdeeService } from '../../services/calcolo-tdee.service';
import { CalcoloTdeeDto } from '../../dto/calcolo-tdee.dto';

@Component({
  selector: 'app-info-cliente',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './info-cliente.html',
  styleUrls: ['./info-cliente.css'],
})
export class InfoClienteComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) cliente!: ClienteDto;
  @Input() isDarkMode = false;

  @Output() apriScheda = new EventEmitter<number>();
  @Output() apriMisurazioni = new EventEmitter<void>();
  @Output() creaNuovaScheda = new EventEmitter<void>();

  private plicoApi = inject(PlicometrieApiService);
  private misurazioneApi = inject(MisurazioneAntropometricaService);
  private schedaApi = inject(SchedaService);
  private tdeeApi = inject(CalcoloTdeeService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  ultimaPlicometria: any = null;
  ultimaMisurazione: any = null;
  schedaAttiva: any = null;
  storicoTdee: CalcoloTdeeDto[] = [];
  tdeeEspansoId: number | null = null;

  // --- STATO DELLE CHECKBOX E DEL MODALE ---
  selezionatiTdee: number[] = [];
  showDeleteModal = false;
  deleteTargetIds: number[] = []; // Array di ID da eliminare

  // Icone
  faUser = faUser; faEnvelope = faEnvelope; faPhone = faPhone;
  faCalendar = faCalendar; faIdCard = faIdCard;
  faWeight = faWeight; faRuler = faRuler; faRunning = faRunning;
  faPercentage = faPercentage; faDumbbell = faDumbbell;
  faRulerCombined = faRulerCombined; faBullseye = faBullseye;
  faClipboardList = faClipboardList; faHeartbeat = faHeartbeat;
  faBolt = faBolt; faTrash = faTrash;
  faChevronDown = faChevronDown; faChevronUp = faChevronUp;
  faUtensils = faUtensils; faExclamationTriangle = faExclamationTriangle;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cliente'] && this.cliente?.id) {
      this.loadDashboardData(this.cliente.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(clienteId: number): void {
    this.plicoApi.allByCliente(clienteId, 0, 1).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.ultimaPlicometria = res.contenuto?.[0] ?? null; this.cdr.markForCheck(); }
    });

    this.misurazioneApi.getAllByCliente(clienteId, 0, 1).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.ultimaMisurazione = res.contenuto?.[0] ?? null; this.cdr.markForCheck(); }
    });

    this.schedaApi.getAllByCliente(clienteId, 0, 50).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.contenuto && res.contenuto.length > 0) {
          this.schedaAttiva = res.contenuto.find((s: any) => s.attiva === true) || null;
        } else {
          this.schedaAttiva = null;
        }
        this.cdr.markForCheck();
      }
    });

    this.tdeeApi.getStoricoCliente(clienteId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.storicoTdee = res || [];
        this.selezionatiTdee = []; // Reset selezione quando si ricaricano i dati
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
          const tId = params['tdeeId'];
          if (tId) {
            const parsedTdeeId = Number(tId);
            if (this.storicoTdee.some(t => t.id === parsedTdeeId)) {
              this.tdeeEspansoId = parsedTdeeId;
              setTimeout(() => {
                const element = document.getElementById('tdee-item-' + parsedTdeeId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }
          }
          this.cdr.markForCheck();
        });
      }
    });
  }

  onSchedaClick(): void { if (this.schedaAttiva?.id) this.apriScheda.emit(this.schedaAttiva.id); }
  onMisurazioneClick(): void { if (this.ultimaMisurazione || this.ultimaPlicometria) this.apriMisurazioni.emit(); }

  formatData(value?: string): string {
    if (!value) return 'N/D';
    const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    return isNaN(d.getTime()) ? 'N/D' : d.toLocaleDateString('it-IT');
  }

  calcolaEta(value?: string): string {
    if (!value) return 'N/D';
    const dob = new Date(value.includes('T') ? value : `${value}T00:00:00`);
    if (isNaN(dob.getTime())) return 'N/D';
    const ageDifMs = Date.now() - dob.getTime();
    return String(Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970)) + ' anni';
  }

  get mgPercent(): number | null {
    if (!this.ultimaPlicometria) return null;
    const mg = this.ultimaPlicometria.massaGrassaKg ?? 0;
    const mm = this.ultimaPlicometria.massaMagraKg ?? 0;
    const tot = mg + mm;
    return tot > 0 ? (mg / tot) * 100 : null;
  }

  get mmPercent(): number | null {
    if (!this.ultimaPlicometria) return null;
    const mg = this.ultimaPlicometria.massaGrassaKg ?? 0;
    const mm = this.ultimaPlicometria.massaMagraKg ?? 0;
    const tot = mg + mm;
    return tot > 0 ? (mm / tot) * 100 : null;
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

  vaiACreaScheda(): void {
    this.creaNuovaScheda.emit();
  }

  toggleTdee(id: number): void {
    this.tdeeEspansoId = this.tdeeEspansoId === id ? null : id;
  }

  getLivelloAttivitaLabel(val: number): string {
    if (!val) return 'N/D';
    if (val === 1.2) return 'Sedentario';
    if (val === 1.375) return 'Leggermente Attivo';
    if (val === 1.55) return 'Moderatamente Attivo';
    if (val === 1.725) return 'Molto Attivo';
    if (val === 1.9) return 'Estremamente Attivo';
    return val.toString();
  }

  vaiACalcoloTdee(): void {
    if (this.cliente?.id) {
      this.router.navigate(['/tdee'], { queryParams: { clienteId: this.cliente.id } });
    }
  }

  vaiAMisurazioni(): void {
    this.apriMisurazioni.emit();
  }

  // --- GESTIONE CHECKBOX ---
  toggleSelezione(id: number, event: Event): void {
    event.stopPropagation();
    const index = this.selezionatiTdee.indexOf(id);
    if (index > -1) {
      this.selezionatiTdee.splice(index, 1);
    } else {
      this.selezionatiTdee.push(id);
    }
  }

  toggleTutti(event: Event): void {
    event.stopPropagation();
    if (this.tuttiSelezionati()) {
      this.selezionatiTdee = [];
    } else {
      this.selezionatiTdee = this.storicoTdee.filter(c => c.id).map(c => c.id!);
    }
  }

  tuttiSelezionati(): boolean {
    return this.storicoTdee.length > 0 && this.selezionatiTdee.length === this.storicoTdee.length;
  }

  // --- GESTIONE MODALE ELIMINAZIONE ---
  apriModalElimina(ids: number[]): void {
    this.deleteTargetIds = ids;
    this.showDeleteModal = true;
  }

  chiudiModalElimina(): void {
    this.showDeleteModal = false;
    this.deleteTargetIds = [];
  }

  confermaEliminazione(): void {
    if (this.deleteTargetIds.length === 0 || !this.cliente?.id) return;

    // Se stiamo eliminando tutti i calcoli presenti
    if (this.deleteTargetIds.length === this.storicoTdee.length) {
      this.tdeeApi.eliminaTuttiCalcoliCliente(this.cliente.id).subscribe({
        next: () => {
          this.storicoTdee = [];
          this.selezionatiTdee = [];
          this.chiudiModalElimina();
          this.cdr.markForCheck();
        },
        error: () => alert("Errore durante l'eliminazione dello storico.")
      });
    } else {
      // Elimina calcoli multipli specifici tramite chiamate parallele
      const deleteRequests = this.deleteTargetIds.map(id => this.tdeeApi.eliminaCalcolo(id));

      forkJoin(deleteRequests).subscribe({
        next: () => {
          // Filtra via quelli eliminati dallo storico locale
          this.storicoTdee = this.storicoTdee.filter(c => !this.deleteTargetIds.includes(c.id!));
          // Rimuovi quelli eliminati dai selezionati
          this.selezionatiTdee = this.selezionatiTdee.filter(id => !this.deleteTargetIds.includes(id));

          this.chiudiModalElimina();
          this.cdr.markForCheck();
        },
        error: () => alert("Errore durante l'eliminazione dei calcoli selezionati.")
      });
    }
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
    return { proG, proKcal, fatMinG, fatMaxG, fatMinKcal, fatMaxKcal, carbMinG, carbMaxG, carbMinKcal, carbMaxKcal };
  }
}