export type ModalitaAppuntamento = 'ONLINE' | 'IN_PRESENZA';
export type StatoAppuntamento = 'PROGRAMMATO' | 'CONFERMATO' | 'ANNULLATO';

export interface AppuntamentoDto {
  id: number;

  nutrizionistaId: number;
  nutrizionistaNome: string;
  nutrizionistaCognome: string;

  clienteId: number | null;
  clienteNome: string | null;
  clienteCognome: string | null;
  clienteRegistrato: boolean;

  descrizioneAppuntamento: string;

  // start
  data: string; // YYYY-MM-DD
  ora: string;  // HH:mm:ss (o HH:mm)

  // end (persistito)
  endData: string; // YYYY-MM-DD
  endOra: string;  // HH:mm:ss (o HH:mm)

  // timezone / all-day
  timezone: string; // es. "Europe/Rome"
  allDay: boolean;

  modalita: ModalitaAppuntamento;
  stato: StatoAppuntamento;

  luogo: string | null;
  emailCliente: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface AppuntamentoFormDto {
  // cliente registrato o guest
  clienteId?: number | null;

  clienteNome?: string;
  clienteCognome?: string;

  descrizioneAppuntamento: string;

  // start
  data: string; // YYYY-MM-DD
  ora: string;  // HH:mm

  //  end (opzionale: se omesso -> backend default +60)
  endData?: string | null; // YYYY-MM-DD
  endOra?: string | null;  // HH:mm

  // timezone/allDay (opzionali)
  timezone?: string | null; // default backend: Europe/Rome
  allDay?: boolean | null;  // default backend: false

  modalita: ModalitaAppuntamento;
  stato?: StatoAppuntamento;

  luogo?: string | null;
  emailCliente: string;
}

export type OpenAgendaPayload =
  | { mode: 'create'; dateIso: string }
  | { mode: 'edit'; appuntamentoId: number };

  export interface CalendarEventDto {
  id: number | string;
  title: string;

  // FullCalendar accetta string ISO o Date. Tu ricevi dal backend JSON di LocalDateTime:
  // in genere è string ISO o struttura. Se già funziona, non toccare.
  start: any;
  end: any;

  extendedProps?: {
    stato?: 'PROGRAMMATO' | 'CONFERMATO' | 'ANNULLATO';
    modalita?: 'ONLINE' | 'IN_PRESENZA';
    luogo?: string | null;
    emailCliente?: string;
    descrizione?: string;

    timezone?: string;
    allDay?: boolean;

    clienteRegistrato?: boolean;
    clienteId?: number | null;
  };

  // campi fullcalendar che tu aggiungi in CalendarioComponent
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  display?: string;
  classNames?: string[];
}