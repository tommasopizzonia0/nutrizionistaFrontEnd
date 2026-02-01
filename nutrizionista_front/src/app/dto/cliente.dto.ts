import { AlimentoDaEvitareDto } from "./alimento-da-evitare.dto";
import { MisurazioneAntropometricaDto } from "./misurazione-antropometrica.dto";
import { SchedaDto } from "./scheda.dto";
import { UtenteDto } from "./utente.dto";

export interface ClienteDto {
  id?: number;
  sesso?: 'Maschio' | 'Femmina';
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  email?: string;
  telefono?: string;
  dataNascita?: string;

  peso?: number;
  altezza?: number;
  numAllenamentiSett?: string;
  intolleranze?: string;
  funzioniIntestinali?: string;
  problematicheSalutari?: string;
  quantitaEQualitaDelSonno?: string;
  assunzioneFarmaci?: string;
  beveAlcol?: boolean;

  alimentiDaEvitare?: AlimentoDaEvitareDto[];
  misurazioni?: MisurazioneAntropometricaDto[];
  schede?: SchedaDto[];
  nutrizionista?: UtenteDto;

  createdAt?: string;
  updatedAt?: string;
}
export interface ClienteFormDto {
  id?: number;
  sesso?: 'Maschio' | 'Femmina';
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  email?: string;
  telefono?: string;
  dataNascita?: string;
  peso?: number;
  altezza?: number;
  numAllenamentiSett?: string;
  intolleranze?: string;
  funzioniIntestinali?: string;
  problematicheSalutari?: string;
  quantitaEQualitaDelSonno?: string;
  assunzioneFarmaci?: string;
  beveAlcol?: boolean;
}