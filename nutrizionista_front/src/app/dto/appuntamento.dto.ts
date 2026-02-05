
export interface CalendarEventDto {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  allDay?: boolean;
  extendedProps?: Record<string, any>;
}

export interface AppuntamentoFormDto {
  clienteId?: number | null;
  clienteNome?: string | null;
  clienteCognome?: string | null;
  emailCliente?: string | null;

  data: string;
  ora: string;
  descrizioneAppuntamento: string;

  modalita: 'ONLINE' | 'IN_PRESENZA';
  stato?: 'PROGRAMMATO' | 'CONFERMATO' | 'ANNULLATO';
  luogo?: string | null;
}


export interface AppuntamentoDto {
  id: number;
  data: string;
  ora: string;
  descrizioneAppuntamento: string;
  modalita: string;
  stato: string;
  luogo?: string | null;
  emailCliente?: string | null;

  clienteId?: number | null;
  clienteNome?: string | null;
  clienteCognome?: string | null;
}


export type AgendaMode = 'create' | 'edit';
export interface OpenAgendaPayload {
  mode: AgendaMode;
  // se edit:
  appuntamentoId?: number;

  // se create da slot:
  dateIso?: string; // es: "2026-02-05T10:00:00"
}