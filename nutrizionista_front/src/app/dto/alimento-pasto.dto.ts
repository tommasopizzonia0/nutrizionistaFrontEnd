import { AlimentoBaseDto } from "./alimento-base.dto";
import { PastoDto } from "./pasto.dto";

export interface AlimentoPastoDto {
    id: number;
    alimento: AlimentoBaseDto;
    pasto: PastoDto;
    quantità: number;
}
export interface AlimentoPastoFormDto {
    id?: number;
    alimento: AlimentoBaseDto;
    pasto: PastoDto;
    quantità: number;
}