import { ClienteDto } from "./cliente.dto";
import { PastoDto } from "./pasto.dto";

export type TipoScheda = 'GIORNALIERA' | 'SETTIMANALE';

export interface SchedaDto {

    id: number;
    nome: string;
    cliente: ClienteDto;
    attiva: boolean;
    pasti?: PastoDto[];
    dataCreazione: string;
    numeroPasti?: number;
    tipo: TipoScheda;
}

export interface SchedaFormDto {
    id?: number;
    nome: string;
    cliente: { id: number };
    attiva?: boolean;
    dataCreazione?: string;
    tipo?: TipoScheda;
}

