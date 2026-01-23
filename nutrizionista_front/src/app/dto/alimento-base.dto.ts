import { AlimentoDaEvitareDto } from "./alimento-da-evitare.dto";
import { AlimentoPastoDto } from "./alimento-pasto.dto";
import { MacroDto } from "./macro.dto";
import { ValoreMicroDto } from "./valore-micro.dto";

export interface AlimentoBaseDto {
    id?: number;
    nome: string;
    alimentiScelti?: AlimentoPastoDto[];
    alimentiEvitati?: AlimentoDaEvitareDto[];
    macroNutrienti: MacroDto;
    micronutrienti?: ValoreMicroDto[];
    misuraInGrammi: number;
}

export interface AlimentoBaseFormDto {
    id?: number;
    nome: string;
    macroNutrienti: MacroDto;
    micronutrienti?: ValoreMicroDto[];
    misuraInGrammi: number;
}