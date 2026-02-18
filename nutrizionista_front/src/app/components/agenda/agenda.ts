import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// Services
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { AgendaStateService } from '../../services/agenda-state.service';
import { AppuntamentiApiService } from '../../services/appuntamenti.service';
import { CalendarRefreshService } from '../../services/calendar-refresh.service';
import { OrariStudioApiService } from '../../services/orari-studio.service';

// DTO
import { AppuntamentoFormDto, OpenAgendaPayload } from '../../dto/appuntamento.dto';
import { OrariStudioDto, OrariStudioFormDto } from '../../dto/orari-studio.dto';

// ✅ Reuse calendario
import { CalendarioComponent } from '../calendario/calendario';

type ClienteDropdown = {
  id: number;
  nome: string;
  cognome: string;
  dataNascita: string;
  email: string;
};

type CalendarAvailability = {
  slotMinTime: string;   // "09:00:00"
  slotMaxTime: string;   // "19:00:00"
  hiddenDays: number[];  // [0] o [0,6]
  pausaInizio: string | null; // "13:00:00"
  pausaFine: string | null;   // "14:00:00"
};

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CalendarioComponent
  ],
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

  // ✅ risultati ricerca clienti
  clientResults: ClienteDropdown[] = [];
  showClientDropdown = false;

  // ✅ Modal orari
  showOrariModal = false;
  orari?: OrariStudioDto;

  calendarAvailability?: CalendarAvailability;

  // ✅ Form orari studio (modal)
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
    descrizioneAppuntamento: ['', Validators.required],

    modalita: ['ONLINE', Validators.required],
    stato: ['PROGRAMMATO'],

    luogo: [''],

    emailCliente: ['', [Validators.required, Validators.email]],

    clienteId: [null as number | null],
    clienteNome: ['', Validators.required],
    clienteCognome: ['', Validators.required],

    // ✅ solo UI: ricerca cliente registrato
    clienteSearch: ['']
  });

  ngOnInit(): void {
    // ✅ carica orari studio (se non esistono -> modal)
    this.loadOrariStudio();

    // ascolta comandi da Calendario
    this.sub = this.agendaState.open$.subscribe((payload) => this.open(payload));

    // ✅ validatori dinamici: se clienteId presente -> registrato, altrimenti guest
    this.form.get('clienteId')!.valueChanges.subscribe((id) => {
      if (id) this.setRegisteredValidators();
      else this.setGuestValidators();
    });

    // all'avvio: guest
    this.setGuestValidators();

    // ✅ ricerca clienti (debounce)
    this.form.get('clienteSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        const query = (q ?? '').trim();
        if (query.length < 2) {
          return of([] as ClienteDropdown[]);
        }
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
  // ✅ Orari studio (modal)
  // =========================

  private loadOrariStudio(): void {
    this.orariApi.getMe().subscribe({
      next: (dto) => {
        this.orari = dto;

        // precompila form modal se vuoi “modificare” in futuro
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
        // se 404 o errore, chiedi setup
        this.showOrariModal = true;
        // set default availability (così il calendario è comunque usabile)
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

    // mini-validazione FE su pausa (evita errori banali)
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
        this.calendarRefresh.requestRefresh(); // ✅ ricarica eventi e pausa
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

    // Domenica sempre nascosta. Sabato nascosto se lavoraSabato=false.
    const hiddenDays = dto.lavoraSabato ? [0] : [0, 6];

    this.calendarAvailability = {
      slotMinTime: `${apertura}:00`,
      slotMaxTime: `${chiusura}:00`,
      hiddenDays,
      pausaInizio: pausaInizio ? `${pausaInizio}:00` : null,
      pausaFine: pausaFine ? `${pausaFine}:00` : null
    };
  }

  // =========================
  // ✅ Apertura form da calendario
  // =========================

  private open(payload: OpenAgendaPayload): void {
    this.error = '';
    this.ok = '';

    if (payload.mode === 'create') {
      this.mode = 'create';
      this.currentId = null;

      if (payload.dateIso) {
        const d = new Date(payload.dateIso);
        const yyyyMmDd = d.toISOString().substring(0, 10);
        const hhmm = d.toISOString().substring(11, 16);
        this.form.patchValue({ data: yyyyMmDd, ora: hhmm });
      }

      this.cdr.detectChanges();
      return;
    }

    this.mode = 'edit';
    this.currentId = payload.appuntamentoId ?? null;
    if (!this.currentId) return;

    this.api.getById(this.currentId).subscribe({
      next: (dto) => {
        const searchLabel = dto?.clienteId
          ? `${dto.clienteNome ?? ''} ${dto.clienteCognome ?? ''}`
          : '';

        this.form.patchValue({
          data: dto.data,
          ora: dto.ora?.substring(0, 5),
          descrizioneAppuntamento: dto.descrizioneAppuntamento,

          modalita: dto.modalita as any,
          stato: dto.stato as any,
          luogo: dto.luogo ?? '',

          emailCliente: dto.emailCliente ?? '',

          clienteId: dto.clienteId ?? null,
          clienteNome: dto.clienteNome ?? '',
          clienteCognome: dto.clienteCognome ?? '',
          clienteSearch: searchLabel
        });

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
  // ✅ Dropdown clienti
  // =========================

  selectClient(c: ClienteDropdown): void {
    this.form.patchValue({
      clienteId: c.id,
      clienteNome: c.nome,
      clienteCognome: c.cognome,
      emailCliente: c.email,
      clienteSearch: `${c.nome} ${c.cognome} (${this.formatDateIt(c.dataNascita)})`
    });

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
    });

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
  // ✅ Validators dinamici
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
  // ✅ CRUD
  // =========================

  save(): void {
    this.error = '';
    this.ok = '';

    if (this.form.invalid) {
      this.error = 'Compila correttamente tutti i campi obbligatori.';
      return;
    }

    const v: any = this.form.getRawValue();

    const payload: AppuntamentoFormDto = {
      data: v.data,
      ora: v.ora,
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

  remove(): void {
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
