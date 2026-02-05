import { ClienteDto } from "./cliente.dto";
import { PastoDto } from "./pasto.dto";

export interface SchedaDto {

    id: number;
    nome: string;
    cliente: ClienteDto;
    attiva: boolean;
    pasti?: PastoDto[];
    dataCreazione: string;
}

export interface SchedaFormDto {
    id?: number;
    nome: string;
    cliente: ClienteDto;
    attiva: boolean;
    dataCreazione: string;
}
