import { AlimentoBaseDto } from './alimento-base.dto';

export interface RicettaIngredienteDto {
  id: number;
  alimento: AlimentoBaseDto;
  quantita: number;
  nomeCustom?: string | null;
  nomeVisualizzato?: string | null;
}

export interface RicettaMacroDto {
  calorie: number;
  proteine: number;
  carboidrati: number;
  grassi: number;
}

export interface RicettaDto {
  id: number;
  titolo: string;
  descrizione?: string;
  categoria?: string;
  urlImmagine?: string;
  fonte?: string;
  pubblica?: boolean;
  ingredienti: RicettaIngredienteDto[];
  macroTotali: RicettaMacroDto;
}
