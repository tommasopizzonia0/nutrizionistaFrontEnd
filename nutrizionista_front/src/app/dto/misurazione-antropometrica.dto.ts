

export interface MisurazioneAntropometricaDto {
  id?: number;
  spalle?: number;
  vita?: number;
  fianchi?: number;
  torace?: number;
  gambaS?: number;
  gambaD?: number;
  bicipiteS?: number;
  bicipiteD?: number;
  dataMisurazione?: string;
  cliente?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface MisurazioneAntropometricaFormDto {
  id?: number;
  spalle?: number;
  vita?: number;
  fianchi?: number;
  torace?: number;
  gambaS?: number;
  gambaD?: number;
  bicipiteS?: number;
  bicipiteD?: number;
  dataMisurazione?: string;
  cliente: {
    id: number;
  };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PageIt<T> {
  contenuto: T[];
  numeroPagina: number;
  dimensionePagina: number;
  totaleElementi: number;
  totalePagine: number;
  ultima: boolean;
}


// DTO locale per il form
export interface MisurazioneDto {
  nome: string;
  valore: number | null;
  unita: string;
  pathId: string;
}