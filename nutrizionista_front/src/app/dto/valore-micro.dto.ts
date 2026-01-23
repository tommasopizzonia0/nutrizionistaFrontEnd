import { AlimentoBaseDto } from "./alimento-base.dto";
import { MicroDto } from "./micro.dto";

export interface ValoreMicroDto {
    id: number;
    alimento: AlimentoBaseDto;
    micronutriente: MicroDto;
    valore: number;
}

export interface ValoreMicroFormDto {
    id?: number;
    alimento: AlimentoBaseDto;
    micronutriente: MicroDto;
    valore: number;
}