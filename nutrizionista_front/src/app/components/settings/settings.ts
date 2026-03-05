import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGear,
  faShieldHalved,
  faKey,
  faXmark,
  faEnvelope,
  faFloppyDisk,
  faCircleCheck,
  faTriangleExclamation,
  faCircleInfo,
  faSliders,
  faHourglassHalf,
  faArrowLeft,
  faLock,
  faClock,
  faCalendarDays,
  faRotate,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';

import { OrariStudioApiService } from '../../services/orari-studio.service';
import { OrariStudioDto, OrariStudioFormDto } from '../../dto/orari-studio.dto';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit {

  loading = false;
  message = '';
  errorMessage = '';

  userData: any = null;

  // ===== Password =====
  isChangingPassword = false;
  passwordForm!: FormGroup;

  // ===== Orari Studio =====
  loadingOrari = false;
  orariMessage = '';
  orariError = '';
  orariData: OrariStudioDto | null = null;

  isEditingOrari = false;
  orariForm!: FormGroup;

  // ===== Icons =====
  icGear: IconDefinition = faGear;
  icShield: IconDefinition = faShieldHalved;
  icKey: IconDefinition = faKey;
  icClose: IconDefinition = faXmark;
  icEnvelope: IconDefinition = faEnvelope;
  icSave: IconDefinition = faFloppyDisk;
  icOk: IconDefinition = faCircleCheck;
  icWarn: IconDefinition = faTriangleExclamation;
  icInfo: IconDefinition = faCircleInfo;
  icSliders: IconDefinition = faSliders;
  icHourglass: IconDefinition = faHourglassHalf;
  icBack: IconDefinition = faArrowLeft;
  icLock: IconDefinition = faLock;

  icClock: IconDefinition = faClock;
  icCalendar: IconDefinition = faCalendarDays;
  icReset: IconDefinition = faRotate;
  icTrash: IconDefinition = faTrash;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private orariStudioApi: OrariStudioApiService,
    public themeService: ThemeService,
    public sidebarService: SidebarService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadMe();
    this.loadOrariStudio();
  }

  // =========================
  // INIT FORMS
  // =========================
  private initForms(): void {
    this.passwordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confermaPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // input[type=time] vuole "HH:mm"
    this.orariForm = this.fb.group({
      oraApertura: ['08:00', [Validators.required]],
      oraChiusura: ['20:00', [Validators.required]],
      pausaInizio: [null], // "HH:mm" | null
      pausaFine: [null],   // "HH:mm" | null
      lavoraSabato: [false]
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const conferma = form.get('confermaPassword')?.value;
    return password === conferma ? null : { passwordMismatch: true };
  }

  // =========================
  // PROFILO
  // =========================
  private loadMe(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: data => {
        this.userData = data;
        this.passwordForm.patchValue({ email: data.email });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento delle impostazioni';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.message = '';
    this.errorMessage = '';

    if (!this.isChangingPassword && this.userData) {
      this.passwordForm.reset({ email: this.userData.email });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.userService.updatePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.message = 'Password aggiornata!';
        this.isChangingPassword = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore cambio password';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // ORARI STUDIO
  // =========================

  toggleOrariEdit(): void {
    this.isEditingOrari = !this.isEditingOrari;
    this.orariMessage = '';
    this.orariError = '';

    if (!this.isEditingOrari) {
      // chiudo: ripristino i valori server
      this.patchOrariFormFromDto(this.orariData);
    }
  }

  loadOrariStudio(): void {
    this.loadingOrari = true;
    this.orariError = '';
    this.orariMessage = '';

    this.orariStudioApi.getMe().subscribe({
      next: (dto) => {
        this.orariData = dto;
        this.patchOrariFormFromDto(dto);
        this.loadingOrari = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.orariError = 'Impossibile caricare gli orari studio.';
        this.loadingOrari = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetOrariToDefault(): void {
    this.orariForm.patchValue({
      oraApertura: '08:00',
      oraChiusura: '20:00',
      pausaInizio: '13:00',
      pausaFine: '14:00',
      lavoraSabato: false
    });
  }

  saveOrariStudio(): void {
    if (this.orariForm.invalid) return;

    this.loadingOrari = true;
    this.orariError = '';
    this.orariMessage = '';

    const apertura = this.orariForm.get('oraApertura')?.value as string;
    const chiusura = this.orariForm.get('oraChiusura')?.value as string;

    if (apertura >= chiusura) {
      this.orariError = 'L’orario di chiusura deve essere successivo all’orario di apertura.';
      this.loadingOrari = false;
      this.cdr.detectChanges();
      return;
    }

    const pStart = this.orariForm.get('pausaInizio')?.value as (string | null);
    const pEnd = this.orariForm.get('pausaFine')?.value as (string | null);

    // se setti fine senza inizio -> errore
    if (!pStart && pEnd) {
      this.orariError = 'Imposta anche l’orario di inizio pausa.';
      this.loadingOrari = false;
      this.cdr.detectChanges();
      return;
    }

    // costruisco payload con regola: se pausaFine mancante -> +1h
    const payload = this.buildOrariPayload();

    // validazione: pausa dentro orari (se presente)
    if (payload.pausaInizio) {
      const ps = payload.pausaInizio;
      const pe = payload.pausaFine ?? this.addHoursHHMM(ps, 1);

      if (ps < payload.oraApertura || pe > payload.oraChiusura) {
        this.orariError = 'La pausa deve rientrare nell’orario di apertura e chiusura.';
        this.loadingOrari = false;
        this.cdr.detectChanges();
        return;
      }

      if (pe <= ps) {
        this.orariError = 'La fine della pausa deve essere successiva all’inizio.';
        this.loadingOrari = false;
        this.cdr.detectChanges();
        return;
      }
    }

    this.orariStudioApi.upsertMe(payload).subscribe({
      next: (dto) => {
        this.orariData = dto;
        this.patchOrariFormFromDto(dto);
        this.orariMessage = 'Orari studio aggiornati!';
        this.isEditingOrari = false;
        this.loadingOrari = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.orariError = 'Errore nel salvataggio degli orari.';
        this.loadingOrari = false;
        this.cdr.detectChanges();
      }
    });
  }

  private patchOrariFormFromDto(dto: OrariStudioDto | null): void {
    if (!dto) return;

    this.orariForm.patchValue({
      oraApertura: this.hhmm(dto.oraApertura),
      oraChiusura: this.hhmm(dto.oraChiusura),
      pausaInizio: dto.pausaInizio ? this.hhmm(dto.pausaInizio) : null,
      pausaFine: dto.pausaFine ? this.hhmm(dto.pausaFine) : null,
      lavoraSabato: !!dto.lavoraSabato
    });
  }

  private buildOrariPayload(): OrariStudioFormDto {
    const v = this.orariForm.value as {
      oraApertura: string;
      oraChiusura: string;
      pausaInizio: string | null;
      pausaFine: string | null;
      lavoraSabato: boolean;
    };

    const oraApertura = this.hhmm(v.oraApertura); // già HH:mm
    const oraChiusura = this.hhmm(v.oraChiusura);

    const pausaInizio = v.pausaInizio ? this.hhmm(v.pausaInizio) : null;

    // regola: se pausaInizio c’è e pausaFine manca -> default +1h
    let pausaFine = v.pausaFine ? this.hhmm(v.pausaFine) : null;
    if (pausaInizio && !pausaFine) pausaFine = this.addHoursHHMM(pausaInizio, 1);

    return {
      oraApertura,
      oraChiusura,
      pausaInizio,
      pausaFine,
      lavoraSabato: !!v.lavoraSabato
    };
  }

  private hhmm(value: string): string {
    // accetta "HH:mm:ss" oppure "HH:mm"
    if (!value) return '';
    return value.length >= 5 ? value.substring(0, 5) : value;
  }

  private addHoursHHMM(timeHHMM: string, hours: number): string {
    // "HH:mm" + hours
    const [h, m] = timeHHMM.split(':').map(Number);
    const total = (h * 60 + m) + hours * 60;
    const t = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(t / 60);
    const mm = t % 60;
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }

  // =========================
  // DANGER ZONE
  // =========================
  deleteAccount(): void {
    if (!confirm('ATTENZIONE: Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione è irreversibile e cancellerà tutti i tuoi dati.')) {
      return;
    }

    this.loading = true;
    this.userService.deleteMyProfile().subscribe({
      next: () => {
        // Reindirizza l'utente alla pagina di login dopo aver eliminato l'account
        window.location.href = '/login';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Errore durante l'eliminazione dell'account.";
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}


