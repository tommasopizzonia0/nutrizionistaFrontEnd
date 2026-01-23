import { ClienteDto } from "./cliente.dto";
import { PastoDto } from "./pasto.dto";

export interface SchedaDto {

    id: number;
    cliente: ClienteDto;
    attiva: boolean;
    pasti?: PastoDto[];
}

export interface SchedaFormDto {
    id?: number;
    cliente: ClienteDto;
    attiva: boolean;
}