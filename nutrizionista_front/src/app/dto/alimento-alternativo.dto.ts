import { AlimentoBaseDto } from './alimento-base.dto';
import { AlimentoPastoDto } from './alimento-pasto.dto';

export type AlternativeModeDto = 'CALORIE' | 'PROTEINE' | 'CARBOIDRATI' | 'GRASSI';

export interface AlimentoAlternativoDto {
    id: number;
    alimentoPasto?: AlimentoPastoDto;
    pastoId?: number;
    alimentoAlternativo: AlimentoBaseDto;
    quantita: number;
    priorita: number;
    mode?: AlternativeModeDto;
    manual?: boolean;
    note?: string;
    nomeCustom?: string | null;
    nomeVisualizzato?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AlimentoAlternativoFormDto {
    id?: number;
    alimentoPastoId: number;
    alimentoAlternativoId: number;
    quantita?: number | null;
    priorita?: number;
    mode?: AlternativeModeDto;
    manual?: boolean;
    note?: string;
}

export interface AlimentoAlternativoUpsertDto {
    id?: number;
    alimentoAlternativoId: number;
    quantita?: number | null;
    priorita?: number | null;
    mode?: AlternativeModeDto | null;
    manual?: boolean | null;
    note?: string | null;
}
