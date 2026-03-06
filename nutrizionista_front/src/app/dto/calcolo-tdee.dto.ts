export interface CalcoloTdeeFormDto {
  clienteId: number;
  sesso: string;
  eta: number;
  peso: number;
  altezza: number;
  livelloAttivita: number;
}

export interface CalcoloTdeeDto {
  id: number;
  dataCalcolo: string; // Arriva in formato "YYYY-MM-DD"
  sesso: string;
  eta: number;
  peso: number;
  altezza: number;
  livelloAttivita: number;
  bmr: number;
  tdee: number;
  clienteId: number;
}