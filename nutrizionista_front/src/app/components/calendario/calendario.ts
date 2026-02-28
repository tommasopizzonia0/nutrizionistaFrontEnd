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
  slotMinTime: string;   // OK anche "08:00:00"
  slotMaxTime: string;   // OK anche "20:00:00"
  hiddenDays: number[];

  // ✅ pausa in "HH:mm" (NO secondi) per compatibilità FullCalendar bg events ricorrenti
  pausaInizio: string | null; // "13:00"
  pausaFine: string | null;   // "14:00"
};

@Component({
  selector: 'calendario',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendario.html',
  styleUrls: ['./calendario.css']
})
export class CalendarioComponent implements AfterViewInit, OnDestroy {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  @Input() availability?: CalendarAvailability;

  private api = inject(AppuntamentiApiService);
  private agendaState = inject(AgendaStateService);
  private calendarRefresh = inject(CalendarRefreshService);

  private sub?: Subscription;

  private readonly colorMap: Record<string, { bg: string; border: string; text: string }> = {
    PROGRAMMATO: { bg: '#f59e0b', border: '#d97706', text: '#111827' },
    CONFERMATO: { bg: '#22c55e', border: '#16a34a', text: '#052e16' },
    ANNULLATO: { bg: '#ef4444', border: '#dc2626', text: '#450a0a' },
  };

  constructor() {
    this.sub = this.calendarRefresh.refresh$.subscribe(() => {
      this.calendarComponent?.getApi?.()?.refetchEvents();
    });
  }

  ngAfterViewInit(): void {
    this.applyAvailabilityToCalendar();
    this.calendarComponent.getApi().refetchEvents();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyAvailabilityToCalendar(): void {
    if (!this.availability || !this.calendarComponent?.getApi) return;

    const calApi = this.calendarComponent.getApi();
    const a = this.availability;

    calApi.setOption('slotMinTime', a.slotMinTime);
    calApi.setOption('slotMaxTime', a.slotMaxTime);
    calApi.setOption('hiddenDays', a.hiddenDays);
    calApi.setOption('scrollTime', a.slotMinTime);
  }

  private buildLunchBreakBackgroundEvent(a?: CalendarAvailability) {
    if (!a?.pausaInizio || !a?.pausaFine) return null;

    // ✅ IMPORTANTISSIMO: startTime/endTime in "HH:mm" (NO secondi)
    const startTime = a.pausaInizio.substring(0, 5);
    const endTime = a.pausaFine.substring(0, 5);

    const workingDays = a.hiddenDays.includes(6) ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];

    return {
      id: 'lunch-break',
      daysOfWeek: workingDays,
      startTime,
      endTime,
      display: 'background',
      classNames: ['lunch-break-strip'],
      editable: false,
      overlap: false
    };
  }

  private parseTimeToMinutes(hhmm: string): number {
    const parts = hhmm.split(':');
    const h = Number(parts[0] ?? 0);
    const m = Number(parts[1] ?? 0);
    return (h * 60) + m;
  }

  private overlapsLunch(start: Date, end: Date, a?: CalendarAvailability): boolean {
    if (!a?.pausaInizio || !a?.pausaFine) return false;

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (!sameDay) return false;

    const sMin = start.getHours() * 60 + start.getMinutes();
    const eMin = end.getHours() * 60 + end.getMinutes();

    const lStart = this.parseTimeToMinutes(a.pausaInizio.substring(0, 5));
    const lEnd = this.parseTimeToMinutes(a.pausaFine.substring(0, 5));

    return sMin < lEnd && eMin > lStart;
  }

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

    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    scrollTime: '08:00:00',

    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },

    // ✅ blocca selezioni che attraversano la pausa
    selectAllow: (selectInfo: any) => {
      const start: Date = selectInfo.start;
      const end: Date = selectInfo.end;
      return !this.overlapsLunch(start, end, this.availability);
    },

    eventDidMount: (info) => {
      if (info.event.id !== 'lunch-break') return;

      const el = info.el as HTMLElement;
      if (el.querySelector('.lb-strip-icon')) return;

      const icon = document.createElement('div');
      icon.className = 'lb-strip-icon';
      icon.title = 'Pausa pranzo';
      icon.innerHTML = `<i class="fa-solid fa-utensils"></i>`;

      el.appendChild(icon);
    },

    events: (info, successCallback, failureCallback) => {
      const start = info.startStr.substring(0, 10);
      const end = info.endStr.substring(0, 10);

      this.api.getMyEvents(start, end).subscribe({
        next: (events: any[]) => {
          const mapped = events.map(e => {
            const stato = e?.extendedProps?.stato ?? e?.stato ?? null;
            const c = stato && this.colorMap[stato] ? this.colorMap[stato] : null;

            return {
              ...e,
              id: String(e.id),
              backgroundColor: c?.bg,
              borderColor: c?.border,
              textColor: c?.text,
              extendedProps: { ...(e.extendedProps ?? {}), stato }
            };
          });

          const lunchEvents = this.buildLunchBreakEventsForRange(info.start, info.end, this.availability);
          successCallback([...mapped, ...lunchEvents] as any);
        },
        error: (err) => failureCallback(err)
      });
    },

    eventClick: (arg: EventClickArg) => {
      const id = Number(arg.event.id);
      this.agendaState.openEdit(id);
    },

    select: (arg: DateSelectArg) => {
      this.agendaState.openCreate(arg.startStr);
    },

    eventDrop: (arg: EventDropArg) => {
      const id = Number(arg.event.id);
      const startStr = arg.event.startStr;
      const endStr = arg.event.endStr ?? null;
      if (!startStr) return;

      const start = arg.event.start!;
      const end = (arg.event.end ?? null) as any;
      if (end && this.overlapsLunch(start, end, this.availability)) {
        arg.revert();
        return;
      }

      this.api.move(id, startStr, endStr).subscribe({
        next: () => this.calendarRefresh.requestRefresh(),
        error: () => arg.revert()
      });
    },

    eventResize: (arg: any) => {
      const id = Number(arg.event.id);
      const startStr = arg.event.startStr;
      const endStr = arg.event.endStr ?? null;
      if (!startStr) return;

      const start = arg.event.start!;
      const end = arg.event.end!;
      if (end && this.overlapsLunch(start, end, this.availability)) {
        arg.revert?.();
        return;
      }

      this.api.move(id, startStr, endStr).subscribe({
        next: () => this.calendarRefresh.requestRefresh(),
        error: () => arg.revert?.()
      });
    }
  };

  private pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  private toYmd(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());
    return `${yyyy}-${mm}-${dd}`;
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + days);
    return x;
  }

  private buildLunchBreakEventsForRange(rangeStart: Date, rangeEnd: Date, a?: any): any[] {
    if (!a?.pausaInizio || !a?.pausaFine) return [];

    const pausaInizio = String(a.pausaInizio).substring(0, 5); // "HH:mm"
    const pausaFine = String(a.pausaFine).substring(0, 5);     // "HH:mm"

    const out: any[] = [];

    // FullCalendar rangeEnd è tipicamente esclusivo
    let d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate(), 0, 0, 0, 0);
    const endDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 0, 0, 0, 0);

    while (d < endDay) {
      const dow = d.getDay(); // 0 dom ... 6 sab

      // hiddenDays: se contiene quel giorno, skip
      if (!a.hiddenDays?.includes(dow)) {
        const ymd = this.toYmd(d);

        out.push({
          id: `lunch-${ymd}`,
          start: `${ymd}T${pausaInizio}:00`,
          end: `${ymd}T${pausaFine}:00`,
          display: 'background',
          classNames: ['lunch-break-strip'],
          editable: false,
          overlap: false
        });
      }

      d = this.addDays(d, 1);
    }

    return out;
  }
}