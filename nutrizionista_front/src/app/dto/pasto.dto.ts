import { AlimentoPastoDto } from "./alimento-pasto.dto";
import { SchedaDto } from "./scheda.dto";

export interface PastoDto {
    id: number;
    nome: string;
    defaultCode?: string | null;
    descrizione?: string | null;
    ordineVisualizzazione?: number;
    eliminabile?: boolean;
    scheda?: SchedaDto;
    alimentiPasto?: AlimentoPastoDto[];
    orarioInizio?: string;
    orarioFine?: string;
}


export interface PastoFormDto {
    id?: number;
    nome?: string;
    scheda: { id: number };
    orarioInizio?: string;
    orarioFine?: string;
    descrizione?: string;
    ordineVisualizzazione?: number;
}
