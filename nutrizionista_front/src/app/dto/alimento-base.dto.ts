import { AlimentoDaEvitareDto } from "./alimento-da-evitare.dto";
import { AlimentoPastoDto } from "./alimento-pasto.dto";
import { MacroDto } from "./macro.dto";
import { ValoreMicroDto } from "./valore-micro.dto";

export interface AlimentoBaseDto {
    id?: number;
    nome: string;
    categoria?: string;
    alimentiScelti?: AlimentoPastoDto[];
    alimentiEvitati?: AlimentoDaEvitareDto[];
    macroNutrienti: MacroDto;
    micronutrienti?: ValoreMicroDto[];
    misuraInGrammi: number;
    urlImmagine?: string;
    tracce?: string[];
    personale?: boolean;
}

export interface AlimentoBaseFormDto {
    id?: number;
    nome: string;
    categoria?: string;
    macroNutrienti: MacroDto;
    micronutrienti?: ValoreMicroDto[];
    misuraInGrammi: number;
    urlImmagine?: string;
    tracce?: string[];
}