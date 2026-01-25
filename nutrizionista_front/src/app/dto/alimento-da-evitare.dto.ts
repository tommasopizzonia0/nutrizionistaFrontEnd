import { AlimentoBaseDto } from "./alimento-base.dto";
import { ClienteDto } from "./cliente.dto";

export interface AlimentoDaEvitareDto {
    id: number;
    alimento: AlimentoBaseDto;
    cliente: ClienteDto;
    tipo?: 'Allergia' | 'Intolleranza' | 'Preferenza' | 'Altro';
    note?: string;
}

export interface AlimentoDaEvitareFormDto {
    id?: number;
    alimento: AlimentoBaseDto;
    cliente: ClienteDto;
    tipo?: 'Allergia' | 'Intolleranza' | 'Preferenza' | 'Altro';
    note?: string;
}