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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser, faEnvelope, faPhone, faCalendar, faIdCard, 
  faWeight, faRuler, faPercentage, faDumbbell, 
  faRulerCombined, faBullseye, faClipboardList, faRunning,
  faHeartbeat
} from '@fortawesome/free-solid-svg-icons';

import { ClienteDto } from '../../dto/cliente.dto';
import { PlicometrieApiService } from '../../services/plicometria.service';
import { MisurazioneAntropometricaService } from '../../services/misurazione-antropometrica.service';
import { SchedaService } from '../../services/scheda-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-info-cliente',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DatePipe, RouterModule],
  templateUrl: './info-cliente.html',
  styleUrls: ['./info-cliente.css'],
})
export class InfoClienteComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) cliente!: ClienteDto;
  @Input() isDarkMode = false; 

  @Output() apriScheda = new EventEmitter<number>(); 
  @Output() apriMisurazioni = new EventEmitter<void>();

  private plicoApi = inject(PlicometrieApiService);
  private misurazioneApi = inject(MisurazioneAntropometricaService);
  private schedaApi = inject(SchedaService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ultimaPlicometria: any = null;
  ultimaMisurazione: any = null;
  schedaAttiva: any = null;
  
  // Icone
  faUser = faUser; faEnvelope = faEnvelope; faPhone = faPhone;
  faCalendar = faCalendar; faIdCard = faIdCard; 
  faWeight = faWeight; faRuler = faRuler; faRunning = faRunning;
  faPercentage = faPercentage; faDumbbell = faDumbbell; 
  faRulerCombined = faRulerCombined; faBullseye = faBullseye;
  faClipboardList = faClipboardList;
  faHeartbeat = faHeartbeat;

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
    // 1. Ultima Plicometria
    this.plicoApi.allByCliente(clienteId, 0, 1).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.ultimaPlicometria = res.contenuto?.[0] ?? null;
          this.cdr.markForCheck();
        }
      });

    // 2. Ultime Circonferenze
    this.misurazioneApi.getAllByCliente(clienteId, 0, 1).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.ultimaMisurazione = res.contenuto?.[0] ?? null;
          this.cdr.markForCheck();
        }
      });

    // 3. Scheda Attiva
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
  }

  onSchedaClick(): void {
    if (this.schedaAttiva?.id) {
      this.apriScheda.emit(this.schedaAttiva.id);
    }
  }

  onMisurazioneClick(): void {
    if (this.ultimaMisurazione || this.ultimaPlicometria) {
      this.apriMisurazioni.emit();
    }
  }

  // --- Helpers Dati ---
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

  // Calcolo Percentuali (Stessa logica usata nel tuo Chart della plicometria)
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

// ==========================================
  // CALCOLI BMI E COMPOSIZIONE CORPOREA
  // ==========================================

  get bmi(): number | null {
    if (!this.cliente?.peso || !this.cliente?.altezza) return null;
    const h = this.cliente.altezza / 100; // converte cm in metri
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
    // Calcola la posizione percentuale del pallino sulla barra (range visuale tra 18.5 e 30)
    return ((Math.min(30, Math.max(18.5, b)) - 18.5) / (30 - 18.5)) * 100;
  }
}