
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
}

export interface ClienteFormDto {
  id?: number;
  sesso?: 'Maschio' | 'Femmina';
  nome: string;
  cognome: string;
  codiceFiscale?: string;
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