import { RuoloDto } from "./ruolo.dto";

/**
 * Modello per il DTO dell'utente
 */
export interface UtenteDto {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  email: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
  ruolo: RuoloDto;
  filePathLogo?: string;
}

/**
 * Modello per il form di creazione/modifica utente
 */
export interface UtenteFormDto {
  id?: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  email: string;
  password: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
  ruolo?: RuoloDto;
}

/**
 * Modello per la richiesta del logo
 */
export interface LogoRequestDto {
  utenteId: number;
  image: File;
}
