import { AlimentoBaseDto } from './alimento-base.dto';

export type AlternativeModeDto = 'CALORIE' | 'PROTEINE' | 'CARBOIDRATI' | 'GRASSI';

export interface PastoTemplateAlternativaDto {
  id?: number;
  alimentoAlternativo: AlimentoBaseDto;
  quantita?: number;
  priorita?: number;
  mode?: AlternativeModeDto;
  manual?: boolean;
  note?: string | null;
  nomeCustom?: string | null;
  nomeVisualizzato?: string | null;
}

export interface PastoTemplateItemDto {
  alimento: AlimentoBaseDto;
  quantita: number;
  nomeCustom?: string | null;
  nomeVisualizzato?: string | null;
  alternative?: PastoTemplateAlternativaDto[];
}

export interface PastoTemplateDto {
  id: number;
  nome: string;
  descrizione: string | null;
  alimenti: PastoTemplateItemDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PastoTemplateAlternativaUpsertDto {
  id?: number;
  alimentoAlternativoId: number;
  quantita?: number;
  priorita?: number;
  mode?: AlternativeModeDto;
  manual?: boolean;
  note?: string | null;
  nomeCustom?: string | null;
}

export interface PastoTemplateUpsertDto {
  nome: string;
  descrizione: string | null;
  alimenti: { alimentoId: number; quantita: number; nomeCustom?: string | null; alternative?: PastoTemplateAlternativaUpsertDto[] }[];
}
