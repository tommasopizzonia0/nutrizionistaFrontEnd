import { Component, OnDestroy, ViewChild, AfterViewInit, inject } from '@angular/core';
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
    // quando entri nella rotta calendario, forza il caricamento eventi
    // (utile se il refresh è stato emesso quando il calendario non era montato)
    this.calendarComponent.getApi().refetchEvents();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

  locale: itLocale,
  timeZone: 'Europe/Rome',

  initialView: 'timeGridWeek',
  firstDay: 1,

  weekNumbers: false,   // ❌ niente "Sm"
  allDaySlot: false,    // ❌ niente "Tutto il giorno"

  selectable: true,
  editable: true,
  eventResizableFromStart: true,
  nowIndicator: true,
  height: 'auto',

  // slotMinTime: '11:00:00',
  // slotMaxTime: '23:00:00',
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


    // carica eventi per range
    events: (info, successCallback, failureCallback) => {
      const start = info.startStr.substring(0, 10);
      const end = info.endStr.substring(0, 10);

      this.api.getMyEvents(start, end).subscribe({
        next: (events: any[]) => {

          const mapped = events.map(e => {
            const stato = e?.extendedProps?.stato ?? e?.stato ?? null;

            // (opzionale) mappa colori per stato
            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              PROGRAMMATO: { bg: '#f59e0b', border: '#d97706', text: '#111827' },
              CONFERMATO: { bg: '#22c55e', border: '#16a34a', text: '#052e16' },
              ANNULLATO: { bg: '#ef4444', border: '#dc2626', text: '#450a0a' },
            };

            const c = stato && colorMap[stato] ? colorMap[stato] : null;

            return {
              ...e,
              id: String(e.id),          // FullCalendar vuole string

              // colori (opzionale)
              backgroundColor: c?.bg,
              borderColor: c?.border,
              textColor: c?.text,

              // conserva lo stato sempre in extendedProps
              extendedProps: {
                ...(e.extendedProps ?? {}),
                stato: stato
              }
            };
          });

          successCallback(mapped as any);
        },
        error: (err) => failureCallback(err)
      });
    },

    // click su evento -> apri agenda in edit
    eventClick: (arg: EventClickArg) => {
      const id = Number(arg.event.id);
      this.agendaState.openEdit(id);
    },

    // selezione slot -> apri agenda in create
    select: (arg: DateSelectArg) => {
      this.agendaState.openCreate(arg.startStr);
    },

    // drag&drop
    // ✅ usa startStr/endStr (coerenti con Europe/Rome) invece di toISOString() (UTC)
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

    // resize
    // ✅ usa startStr/endStr invece di toISOString()
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
