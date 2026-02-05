import { Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [FullCalendarModule], 
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario {

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    locale: 'it', 
    events: [
      { title: 'Visita Rossi', date: '2026-02-10' },
      { title: 'Controllo Bianchi', date: '2026-02-12' }
    ],
    dateClick: (arg) => this.handleDateClick(arg),
  };

  handleDateClick(arg: any) {
    alert('Hai cliccato sul giorno: ' + arg.dateStr);
  }
}