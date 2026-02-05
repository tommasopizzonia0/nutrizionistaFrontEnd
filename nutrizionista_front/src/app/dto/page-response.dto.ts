export interface PageResponse<T> {
  contenuto: T[];
  numeroPagina: number;
  dimensionePagina: number;
  totaleElementi: number;
  totalePagine: number;
  ultima: boolean;
}
