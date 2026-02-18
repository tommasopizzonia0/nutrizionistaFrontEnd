import { Component, OnDestroy, ViewChild, AfterViewInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { Subscription } from 'rxjs';

import {
  CalendarOptions,
  EventClickArg,
  EventDropArg,
  DateSelectArg
} from '@fullcalendar/core';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import itLocale from '@fullcalendar/core/locales/it';

import { AppuntamentiApiService } from '../../services/appuntamenti.service';
import { AgendaStateService } from '../../services/agenda-state.service';
import { CalendarRefreshService } from '../../services/calendar-refresh.service';

type CalendarAvailability = {
  slotMinTime: string;   // "09:00:00"
  slotMaxTime: string;   // "19:00:00"
  hiddenDays: number[];  // [0] o [0,6]
  pausaInizio: string | null; // "13:00:00"
  pausaFine: string | null;   // "14:00:00"
};

@Component({
  selector: 'calendario',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule
  ],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css']
})
export class CalendarioComponent implements AfterViewInit, OnDestroy {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // ✅ arriva da Agenda (orari studio)
  @Input() availability?: CalendarAvailability;

  private api = inject(AppuntamentiApiService);
  private agendaState = inject(AgendaStateService);
  private calendarRefresh = inject(CalendarRefreshService);

  private sub?: Subscription;

  constructor() {
    // ascolta i refresh richiesti da altre rotte (Agenda)
    this.sub = this.calendarRefresh.refresh$.subscribe(() => {
      const calApi = this.calendarComponent?.getApi?.();
      calApi?.refetchEvents();
    });
  }

  ngAfterViewInit(): void {
    this.applyAvailabilityToCalendar(); // ✅ applica appena montato
    this.calendarComponent.getApi().refetchEvents();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // =========================
  // ✅ Helpers availability
  // =========================

  private applyAvailabilityToCalendar(): void {
    if (!this.availability || !this.calendarComponent?.getApi) return;

    const calApi = this.calendarComponent.getApi();
    const a = this.availability;

    // setOption aggiorna dinamicamente senza ricreare tutto
    calApi.setOption('slotMinTime', a.slotMinTime);
    calApi.setOption('slotMaxTime', a.slotMaxTime);
    calApi.setOption('hiddenDays', a.hiddenDays);

    // (opzionale) scrollTime = apertura
    calApi.setOption('scrollTime', a.slotMinTime);
  }

  private buildLunchBreakBackgroundEvent(a?: CalendarAvailability) {
    if (!a?.pausaInizio || !a?.pausaFine) return null;

    // lun-ven sempre, + sabato se non è nascosto
    const workingDays = a.hiddenDays.includes(6) ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];

    return {
      id: 'lunch-break',
      daysOfWeek: workingDays,
      startTime: a.pausaInizio,
      endTime: a.pausaFine,
      display: 'background',
      classNames: ['lunch-break'],
      editable: false,
      overlap: false
    };
  }

  private isInLunchBreak(date: Date, a?: CalendarAvailability): boolean {
    if (!a?.pausaInizio || !a?.pausaFine) return false;

    const hhmmss = (d: Date) => d.toTimeString().substring(0, 8); // "HH:MM:SS"
    const t = hhmmss(date);

    return t >= a.pausaInizio && t < a.pausaFine;
  }

  // =========================
  // ✅ Calendar options
  // =========================

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    locale: itLocale,
    timeZone: 'Europe/Rome',

    initialView: 'timeGridWeek',
    firstDay: 1,

    weekNumbers: false,
    allDaySlot: false,

    selectable: true,
    editable: true,
    eventResizableFromStart: true,
    nowIndicator: true,
    height: 'auto',

    // ✅ default, poi verrà sovrascritto via availability se presente
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    scrollTime: '08:00:00',

    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },

    // ✅ blocca selezione in pausa pranzo (UI)
    selectAllow: (selectInfo) => {
      return !this.isInLunchBreak(selectInfo.start, this.availability);
    },

    // carica eventi per range
    events: (info, successCallback, failureCallback) => {
      const start = info.startStr.substring(0, 10);
      const end = info.endStr.substring(0, 10);

      this.api.getMyEvents(start, end).subscribe({
        next: (events: any[]) => {

          const mapped = events.map(e => {
            const stato = e?.extendedProps?.stato ?? e?.stato ?? null;

            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              PROGRAMMATO: { bg: '#f59e0b', border: '#d97706', text: '#111827' },
              CONFERMATO: { bg: '#22c55e', border: '#16a34a', text: '#052e16' },
              ANNULLATO: { bg: '#ef4444', border: '#dc2626', text: '#450a0a' },
            };

            const c = stato && colorMap[stato] ? colorMap[stato] : null;

            return {
              ...e,
              id: String(e.id),

              backgroundColor: c?.bg,
              borderColor: c?.border,
              textColor: c?.text,

              extendedProps: {
                ...(e.extendedProps ?? {}),
                stato: stato
              }
            };
          });

          // ✅ aggiungi pausa pranzo come background event
          const lunch = this.buildLunchBreakBackgroundEvent(this.availability);
          const out = lunch ? [...mapped, lunch] : mapped;

          successCallback(out as any);
        },
        error: (err) => failureCallback(err)
      });
    },

    eventClick: (arg: EventClickArg) => {
      const id = Number(arg.event.id);
      this.agendaState.openEdit(id);
    },

    select: (arg: DateSelectArg) => {
      // se click in pausa: non aprire form (extra safety)
      if (this.isInLunchBreak(arg.start, this.availability)) return;

      this.agendaState.openCreate(arg.startStr);
    },

    eventDrop: (arg: EventDropArg) => {
      const id = Number(arg.event.id);
      const startStr = arg.event.startStr;
      const endStr = arg.event.endStr ?? null;

      if (!startStr) return;

      this.api.move(id, startStr, endStr).subscribe({
        next: () => { },
        error: () => arg.revert()
      });
    },

    eventResize: (arg: any) => {
      const id = Number(arg.event.id);
      const startStr = arg.event.startStr;
      const endStr = arg.event.endStr ?? null;

      if (!startStr) return;

      this.api.move(id, startStr, endStr).subscribe({
        next: () => { },
        error: () => arg.revert?.()
      });
    }
  };
}
