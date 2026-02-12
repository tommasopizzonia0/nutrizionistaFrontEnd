export type Metodo =
  | 'JACKSON_POLLOCK_3'
  | 'JACKSON_POLLOCK_7'
  | 'DURNIN_WOMERSLEY'
  | 'PARILLO'
  | 'MISURAZIONE_LIBERA';

export interface ClienteIdDto {
  id: number;
}

// quello che invii al backend (PlicometriaFormDto)
export interface PlicometriaFormDto {
  id?: number | null;
  cliente: ClienteIdDto;
  metodo: Metodo;
  dataMisurazione: string; // "YYYY-MM-DD"

  tricipite?: number | null;
  bicipite?: number | null;
  sottoscapolare?: number | null;
  sovrailiaca?: number | null;
  addominale?: number | null;
  coscia?: number | null;
  pettorale?: number | null;
  ascellare?: number | null;
  polpaccio?: number | null;

  note?: string | null;
}

// quello che ricevi dal backend (PlicometriaDto)
export interface PlicometriaDto {
  id: number;
  dataMisurazione: string;
  metodo: Metodo;

  tricipite?: number | null;
  bicipite?: number | null;
  sottoscapolare?: number | null;
  sovrailiaca?: number | null;
  addominale?: number | null;
  coscia?: number | null;
  pettorale?: number | null;
  ascellare?: number | null;
  polpaccio?: number | null;

  note?: string | null;

  // risultati calcolati BE
  pesoKgRiferimento?: number | null;
  sommaPliche?: number | null;
  densitaCorporea?: number | null;
  percentualeMassaGrassa?: number | null;
  massaGrassaKg?: number | null;
  massaMagraKg?: number | null;
}


