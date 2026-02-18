export type OrariStudioDto = {
  id: number;
  nutrizionistaId: number;
  oraApertura: string;   // "08:00:00" o "08:00"
  oraChiusura: string;   // "20:00:00" o "20:00"
  pausaInizio?: string | null;
  pausaFine?: string | null;
  lavoraSabato: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OrariStudioFormDto = {
  oraApertura: string;   // "08:00"
  oraChiusura: string;   // "20:00"
  pausaInizio?: string | null;
  pausaFine?: string | null;
  lavoraSabato: boolean;
};