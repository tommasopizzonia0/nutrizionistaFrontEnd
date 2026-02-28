import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { AgendaStateService } from '../../services/agenda-state.service';
import { AppuntamentiApiService } from '../../services/appuntamenti.service';
import { CalendarRefreshService } from '../../services/calendar-refresh.service';
import { OrariStudioApiService } from '../../services/orari-studio.service';

import { AppuntamentoFormDto, OpenAgendaPayload, AppuntamentoDto } from '../../dto/appuntamento.dto';
import { OrariStudioDto, OrariStudioFormDto } from '../../dto/orari-studio.dto';

import { CalendarioComponent } from '../calendario/calendario';

type ClienteDropdown = {
  id: number;
  nome: string;
  cognome: string;
  dataNascita: string;
  email: string;
};

type CalendarAvailability = {
  slotMinTime: string;
  slotMaxTime: string;
  hiddenDays: number[];
  pausaInizio: string | null;
  pausaFine: string | null;
};

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CalendarioComponent],
  templateUrl: './agenda.html',
  styleUrls: ['./agenda.css']
})
export class AgendaComponent implements OnInit, OnDestroy {

  mode: 'create' | 'edit' = 'create';
  currentId: number | null = null;

  error = '';
  ok = '';

  private sub?: Subscription;

  private fb = inject(FormBuilder);
  private agendaState = inject(AgendaStateService);
  private api = inject(AppuntamentiApiService);
  private calendarRefresh = inject(CalendarRefreshService);
  private orariApi = inject(OrariStudioApiService);
  private cdr = inject(ChangeDetectorRef);

  public themeService = inject(ThemeService);
  public sidebarService = inject(SidebarService);

  clientResults: ClienteDropdown[] = [];
  showClientDropdown = false;

  showOrariModal = false;
  orari?: OrariStudioDto;

  calendarAvailability?: CalendarAvailability;

  // ✅ durate selezionabili (minuti)
  durate = [
    { label: '30 minuti', value: 30 },
    { label: '45 minuti', value: 45 },
    { label: '1 ora', value: 60 },
    { label: '1h 30m', value: 90 },
    { label: '2 ore', value: 120 },
  ];

  orariForm = this.fb.group({
    oraApertura: ['09:00', Validators.required],
    oraChiusura: ['19:00', Validators.required],
    pausaInizio: ['13:00'],
    pausaFine: ['14:00'],
    lavoraSabato: [false]
  });

  form = this.fb.group({
    data: ['', Validators.required],
    ora: ['', Validators.required],

    // ✅ durata (minuti)
    durataMinuti: [60, Validators.required],

    descrizioneAppuntamento: ['', Validators.required],

    modalita: ['ONLINE', Validators.required],
    stato: ['PROGRAMMATO'],

    luogo: [''],

    emailCliente: ['', [Validators.required, Validators.email]],

    clienteId: [null as number | null],
    clienteNome: ['', Validators.required],
    clienteCognome: ['', Validators.required],

    clienteSearch: ['']
  });

  ngOnInit(): void {
    this.loadOrariStudio();

    this.sub = this.agendaState.open$.subscribe((payload) => this.open(payload));

    this.form.get('clienteId')!.valueChanges.subscribe((id) => {
      if (id) this.setRegisteredValidators();
      else this.setGuestValidators();
    });

    this.setGuestValidators();

    this.form.get('clienteSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        const query = (q ?? '').trim();
        if (query.length < 2) return of([] as ClienteDropdown[]);
        return this.api.getMyClientsDropdown(query).pipe(
          catchError(() => of([] as ClienteDropdown[]))
        );
      })
    ).subscribe((res) => {
      this.clientResults = res;
      this.showClientDropdown = res.length > 0;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // =========================
  // Orari studio
  // =========================

  private loadOrariStudio(): void {
    this.orariApi.getMe().subscribe({
      next: (dto) => {
        this.orari = dto;

        this.orariForm.patchValue({
          oraApertura: this.normalizeTime(dto.oraApertura) ?? '09:00',
          oraChiusura: this.normalizeTime(dto.oraChiusura) ?? '19:00',
          pausaInizio: this.normalizeTime(dto.pausaInizio ?? null) ?? '',
          pausaFine: this.normalizeTime(dto.pausaFine ?? null) ?? '',
          lavoraSabato: dto.lavoraSabato
        }, { emitEvent: false });

        this.showOrariModal = false;
        this.applyOrariToCalendar(dto);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showOrariModal = true;
        this.calendarAvailability = {
          slotMinTime: '08:00:00',
          slotMaxTime: '20:00:00',
          hiddenDays: [0, 6],
          pausaInizio: null,
          pausaFine: null
        };
        this.cdr.detectChanges();
      }
    });
  }

  saveOrari(): void {
    this.error = '';
    this.ok = '';

    if (this.orariForm.invalid) {
      this.error = 'Compila correttamente gli orari obbligatori.';
      this.cdr.detectChanges();
      return;
    }

    const v: any = this.orariForm.getRawValue();

    const payload: OrariStudioFormDto = {
      oraApertura: v.oraApertura,
      oraChiusura: v.oraChiusura,
      pausaInizio: (v.pausaInizio ?? '').trim() ? v.pausaInizio : null,
      pausaFine: (v.pausaFine ?? '').trim() ? v.pausaFine : null,
      lavoraSabato: !!v.lavoraSabato
    };

    if ((payload.pausaInizio && !payload.pausaFine) || (!payload.pausaInizio && payload.pausaFine)) {
      this.error = 'Inserisci sia inizio che fine pausa (oppure lascia entrambi vuoti).';
      this.cdr.detectChanges();
      return;
    }

    this.orariApi.upsertMe(payload).subscribe({
      next: (dto) => {
        this.orari = dto;
        this.showOrariModal = false;
        this.applyOrariToCalendar(dto);
        this.calendarRefresh.requestRefresh();
        this.ok = 'Orari studio salvati';
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error = e?.error?.error ?? 'Errore salvataggio orari studio';
        this.cdr.detectChanges();
      }
    });
  }

  private normalizeTime(hhmmOrHhmmss: string | null | undefined): string | null {
    if (!hhmmOrHhmmss) return null;
    return hhmmOrHhmmss.length >= 5 ? hhmmOrHhmmss.substring(0, 5) : hhmmOrHhmmss;
  }

  private applyOrariToCalendar(dto: OrariStudioDto): void {
    const apertura = this.normalizeTime(dto.oraApertura) ?? '08:00';
    const chiusura = this.normalizeTime(dto.oraChiusura) ?? '20:00';

    const pausaInizio = this.normalizeTime(dto.pausaInizio ?? null);
    const pausaFine = this.normalizeTime(dto.pausaFine ?? null);

    const hiddenDays = dto.lavoraSabato ? [0] : [0, 6];

    this.calendarAvailability = {
      // slotMin/Max possono restare HH:mm:ss
      slotMinTime: `${apertura}:00`,
      slotMaxTime: `${chiusura}:00`,
      hiddenDays,

      // ✅ pausa SOLO HH:mm
      pausaInizio: pausaInizio ? pausaInizio : null,
      pausaFine: pausaFine ? pausaFine : null
    };
  }

  // =========================
  // Durata -> endData/endOra
  // =========================

  private computeEnd(data: string, ora: string, durataMinuti: number): { endData: string; endOra: string } {
    const [y, m, d] = data.split('-').map(Number);
    const [hh, mm] = ora.split(':').map(Number);

    const start = new Date(y, (m - 1), d, hh, mm, 0, 0);
    const end = new Date(start.getTime() + durataMinuti * 60 * 1000);

    const yyyy = end.getFullYear();
    const mm2 = String(end.getMonth() + 1).padStart(2, '0');
    const dd2 = String(end.getDate()).padStart(2, '0');

    const hh2 = String(end.getHours()).padStart(2, '0');
    const min2 = String(end.getMinutes()).padStart(2, '0');

    return { endData: `${yyyy}-${mm2}-${dd2}`, endOra: `${hh2}:${min2}` };
  }

  private calcDurataFromDto(dto: any): number {
    const startData = dto?.data;
    const startOra = dto?.ora ? String(dto.ora).substring(0, 5) : '';

    const endData = dto?.endData;
    const endOra = dto?.endOra ? String(dto.endOra).substring(0, 5) : '';

    let durata = 60;

    if (startData && startOra && endData && endOra) {
      const [sy, sm, sd] = startData.split('-').map(Number);
      const [sh, smin] = startOra.split(':').map(Number);
      const s = new Date(sy, sm - 1, sd, sh, smin, 0, 0);

      const [ey, em, ed] = endData.split('-').map(Number);
      const [eh, emin] = endOra.split(':').map(Number);
      const e = new Date(ey, em - 1, ed, eh, emin, 0, 0);

      const diff = Math.round((e.getTime() - s.getTime()) / 60000);
      if (diff > 0) durata = diff;
    }

    return durata;
  }

  // =========================
  // Open form
  // =========================

  private open(payload: OpenAgendaPayload): void {
    this.error = '';
    this.ok = '';

    if (payload.mode === 'create') {
      this.mode = 'create';
      this.currentId = null;

      if (payload.dateIso) {
        // ✅ locale (no UTC ISO conversion)
        const d = new Date(payload.dateIso);

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');

        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');

        this.form.patchValue({ data: `${yyyy}-${mm}-${dd}`, ora: `${hh}:${min}` }, { emitEvent: false });
      }

      this.form.patchValue({ durataMinuti: 60 }, { emitEvent: false });

      this.setGuestValidators();
      this.cdr.detectChanges();
      return;
    }

    this.mode = 'edit';
    this.currentId = payload.appuntamentoId ?? null;
    if (!this.currentId) return;

    this.api.getById(this.currentId).subscribe({
      next: (dto: AppuntamentoDto) => {
        const searchLabel = dto?.clienteId
          ? `${dto.clienteNome ?? ''} ${dto.clienteCognome ?? ''}`
          : '';

        const durata = this.calcDurataFromDto(dto);

        this.form.patchValue({
          data: dto.data,
          ora: dto.ora ? dto.ora.substring(0, 5) : '',
          durataMinuti: durata,

          descrizioneAppuntamento: dto.descrizioneAppuntamento,

          modalita: dto.modalita as any,
          stato: dto.stato as any,
          luogo: dto.luogo ?? '',

          emailCliente: dto.emailCliente ?? '',

          clienteId: dto.clienteId ?? null,
          clienteNome: dto.clienteNome ?? '',
          clienteCognome: dto.clienteCognome ?? '',
          clienteSearch: searchLabel
        }, { emitEvent: false });

        if (dto.clienteId) this.setRegisteredValidators();
        else this.setGuestValidators();

        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error = e?.error?.error ?? 'Errore nel caricamento';
        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // Client dropdown
  // =========================

  selectClient(c: ClienteDropdown): void {
    this.form.patchValue({
      clienteId: c.id,
      clienteNome: c.nome,
      clienteCognome: c.cognome,
      emailCliente: c.email,
      clienteSearch: `${c.nome} ${c.cognome} (${this.formatDateIt(c.dataNascita)})`
    }, { emitEvent: false });

    this.showClientDropdown = false;
    this.clientResults = [];
    this.cdr.detectChanges();
  }

  clearSelectedClient(): void {
    this.form.patchValue({
      clienteId: null,
      clienteNome: '',
      clienteCognome: '',
      emailCliente: '',
      clienteSearch: ''
    }, { emitEvent: false });

    this.setGuestValidators();

    this.showClientDropdown = false;
    this.clientResults = [];
    this.cdr.detectChanges();
  }

  onSearchFocus(): void {
    this.showClientDropdown = this.clientResults.length > 0;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showClientDropdown = false;
      this.cdr.detectChanges();
    }, 150);
  }

  formatDateIt(iso: string): string {
    const [y, m, d] = (iso ?? '').split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  // =========================
  // Validators
  // =========================

  private setGuestValidators(): void {
    const nome = this.form.get('clienteNome')!;
    const cognome = this.form.get('clienteCognome')!;
    const email = this.form.get('emailCliente')!;

    nome.setValidators([Validators.required]);
    cognome.setValidators([Validators.required]);
    email.setValidators([Validators.required, Validators.email]);

    nome.enable({ emitEvent: false });
    cognome.enable({ emitEvent: false });
    email.enable({ emitEvent: false });

    nome.updateValueAndValidity({ emitEvent: false });
    cognome.updateValueAndValidity({ emitEvent: false });
    email.updateValueAndValidity({ emitEvent: false });
  }

  private setRegisteredValidators(): void {
    const nome = this.form.get('clienteNome')!;
    const cognome = this.form.get('clienteCognome')!;
    const email = this.form.get('emailCliente')!;

    nome.clearValidators();
    cognome.clearValidators();
    email.clearValidators();

    nome.disable({ emitEvent: false });
    cognome.disable({ emitEvent: false });
    email.disable({ emitEvent: false });

    nome.updateValueAndValidity({ emitEvent: false });
    cognome.updateValueAndValidity({ emitEvent: false });
    email.updateValueAndValidity({ emitEvent: false });
  }

  // =========================
  // CRUD
  // =========================

  save(): void {
    this.error = '';
    this.ok = '';

    if (this.form.invalid) {
      this.error = 'Compila correttamente tutti i campi obbligatori.';
      this.cdr.detectChanges();
      return;
    }

    const v: any = this.form.getRawValue();

    const durataMinuti = Number(v.durataMinuti ?? 60);
    const end = this.computeEnd(v.data, v.ora, durataMinuti);

    const payload: AppuntamentoFormDto = {
      data: v.data,
      ora: v.ora,

      endData: end.endData,
      endOra: end.endOra,

      timezone: 'Europe/Rome',
      allDay: false,

      descrizioneAppuntamento: v.descrizioneAppuntamento,
      modalita: v.modalita,
      stato: v.stato,
      luogo: v.luogo,

      emailCliente: v.emailCliente,

      clienteId: v.clienteId,
      clienteNome: v.clienteNome,
      clienteCognome: v.clienteCognome
    };

    if (this.mode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.ok = 'Appuntamento creato';
          this.calendarRefresh.requestRefresh();
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.error = e?.error?.error ?? 'Errore creazione';
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (!this.currentId) return;

    this.api.update(this.currentId, payload).subscribe({
      next: () => {
        this.ok = 'Appuntamento aggiornato';
        this.calendarRefresh.requestRefresh();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error = e?.error?.error ?? 'Errore aggiornamento';
        this.cdr.detectChanges();
      }
    });
  }

  delete(): void {
    if (!this.currentId) return;

    this.error = '';
    this.ok = '';

    this.api.delete(this.currentId).subscribe({
      next: () => {
        this.ok = 'Appuntamento eliminato';
        this.calendarRefresh.requestRefresh();
        this.reset();
        this.mode = 'create';
        this.currentId = null;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error = e?.error?.error ?? 'Errore eliminazione';
        this.cdr.detectChanges();
      }
    });
  }

  reset(): void {
    this.error = '';
    this.ok = '';

    this.form.reset({
      data: '',
      ora: '',
      durataMinuti: 60,
      descrizioneAppuntamento: '',
      modalita: 'ONLINE',
      stato: 'PROGRAMMATO',
      luogo: '',
      emailCliente: '',
      clienteId: null,
      clienteNome: '',
      clienteCognome: '',
      clienteSearch: ''
    });

    this.setGuestValidators();
    this.cdr.detectChanges();
  }
}