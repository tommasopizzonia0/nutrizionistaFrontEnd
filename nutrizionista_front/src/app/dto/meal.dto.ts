import { PastoDto } from "./pasto.dto";

export interface MealCreateRequest {
  schedaId: number;
  nome: string;
  descrizione?: string;
  ordineVisualizzazione?: number;
  giorno?: string;
}

export interface MealUpdateRequest {
  nome: string;
  descrizione?: string;
  ordineVisualizzazione?: number;
}

export type MealDto = PastoDto;

