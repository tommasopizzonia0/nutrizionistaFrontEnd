import { AlimentoBaseDto } from "./alimento-base.dto";

export interface MacroDto {
    id: number;
    alimento: AlimentoBaseDto;
    calorie: number;
    grassi: number;
    proteine: number;
    carboidrati: number;
}

export interface MacroFormDto {
    id?: number;
    alimento: AlimentoBaseDto;
    calorie: number;
    grassi: number;
    proteine: number;
    carboidrati: number;
}