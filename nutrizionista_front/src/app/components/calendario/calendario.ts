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
    initialView: 'timeGridWeek',
    selectable: true,
    editable: true,
    eventResizableFromStart: true,
    nowIndicator: true,
    height: 'auto',

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

            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              PROGRAMMATO: { bg: '#f59e0b', border: '#d97706', text: '#111827' },
              CONFERMATO: { bg: '#22c55e', border: '#16a34a', text: '#052e16' },
              ANNULLATO: { bg: '#ef4444', border: '#dc2626', text: '#450a0a' },
            };

            const c = stato && colorMap[stato] ? colorMap[stato] : null;

            return {
              ...e,
              id: String(e.id),          // ⚠️ FullCalendar vuole string
              backgroundColor: c?.bg,
              borderColor: c?.border,
              textColor: c?.text,
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
      // qui non navighiamo: l’Agenda è su un’altra rotta.
      // se vuoi navigare automaticamente, dimmelo e lo aggiungo.
    },

    // selezione slot -> apri agenda in create
    select: (arg: DateSelectArg) => {
      this.agendaState.openCreate(arg.startStr);
      // idem: se vuoi navigare alla rotta agenda, dimmelo.
    },

    // drag&drop
    eventDrop: (arg: EventDropArg) => {
      const id = Number(arg.event.id);
      const startIso = arg.event.start?.toISOString();
      const endIso = arg.event.end?.toISOString() ?? null;

      if (!startIso) return;

      this.api.move(id, startIso, endIso).subscribe({
        next: () => { },
        error: () => arg.revert()
      });
    },

    // resize (typing non esportato nella tua versione -> any)
    eventResize: (arg: any) => {
      const id = Number(arg.event.id);
      const startIso = arg.event.start?.toISOString();
      const endIso = arg.event.end?.toISOString() ?? null;

      if (!startIso) return;

      this.api.move(id, startIso, endIso).subscribe({
        next: () => { },
        error: () => arg.revert?.()
      });
    }



  };
}
