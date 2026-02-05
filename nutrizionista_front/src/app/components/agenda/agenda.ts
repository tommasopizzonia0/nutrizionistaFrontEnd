import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

// Services
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { AgendaStateService } from '../../services/agenda-state.service';
import { AppuntamentiApiService } from '../../services/appuntamenti.service';
import { CalendarRefreshService } from '../../services/calendar-refresh.service';

// DTO
import { AppuntamentoFormDto, OpenAgendaPayload } from '../../dto/appuntamento.dto';

// ✅ Reuse calendario
import { CalendarioComponent } from '../calendario/calendario';

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
  private cdr = inject(ChangeDetectorRef);

  public themeService = inject(ThemeService);
  public sidebarService = inject(SidebarService);

  form = this.fb.group({
    data: ['', Validators.required],
    ora: ['', Validators.required],
    descrizioneAppuntamento: ['', Validators.required],

    modalita: ['ONLINE', Validators.required],
    stato: ['PROGRAMMATO'], // ✅ allineato all'enum backend

    luogo: [''],
    emailCliente: ['', [Validators.required, Validators.email]],

    clienteId: [null as number | null],
    clienteNome: ['', Validators.required],
    clienteCognome: ['', Validators.required],
  });

  ngOnInit(): void {
    // ascolta comandi da Calendario (anche se storicamente erano rotte diverse)
    this.sub = this.agendaState.open$.subscribe((payload) => this.open(payload));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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
          clienteCognome: dto.clienteCognome ?? ''
        });

        this.cdr.detectChanges();
      },
      error: (e) => {
        this.error = e?.error?.error ?? 'Errore nel caricamento';
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    this.error = '';
    this.ok = '';

    if (this.form.invalid) {
      this.error = 'Compila correttamente tutti i campi obbligatori.';
      return;
    }

    const v: any = this.form.value;

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
          this.calendarRefresh.requestRefresh(); // ✅ ricarica preview calendario
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
        this.calendarRefresh.requestRefresh(); // ✅
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
        this.calendarRefresh.requestRefresh(); // ✅
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
      clienteCognome: ''
    });

    this.cdr.detectChanges();
  }
}
