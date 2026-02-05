import { AlimentoPastoDto } from "./alimento-pasto.dto";
import { SchedaDto } from "./scheda.dto";

export interface PastoDto {
    id: number;
    nome: 'Colazione' | 'Pranzo' | 'Cena' | 'Merenda';
    scheda?: SchedaDto;
    alimentiPasto?: AlimentoPastoDto[];
    orarioInizio?: string;
    orarioFine?: string;
}


export interface PastoFormDto {
    id?: number;
    nome?: 'Colazione' | 'Pranzo' | 'Cena' | 'Merenda';
    scheda: SchedaDto;
    orarioInizio?: string;
    orarioFine?: string;
}