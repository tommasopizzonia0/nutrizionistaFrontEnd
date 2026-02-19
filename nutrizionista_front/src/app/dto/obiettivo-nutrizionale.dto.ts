export type TipoObiettivo = 'DIMAGRIMENTO' | 'MANTENIMENTO' | 'MASSA' | 'RICOMPOSIZIONE';

export type LivelloDiAttivita =
    | 'SEDENTARIO'
    | 'LEGGERMENTE_ATTIVO'
    | 'MODERATAMENTE_ATTIVO'
    | 'MOLTO_ATTIVO'
    | 'ESTREMAMENTE_ATTIVO';

export interface ObiettivoNutrizionaleDto {
    id?: number;
    clienteId?: number;
    obiettivo: TipoObiettivo;

    bmr?: number;
    tdee?: number;
    laf?: number;

    targetCalorie?: number;
    targetProteine?: number;
    targetCarboidrati?: number;
    targetGrassi?: number;
    targetFibre?: number;

    pctProteine?: number;
    pctCarboidrati?: number;
    pctGrassi?: number;

    note?: string;

    createdAt?: string;
    updatedAt?: string;
}

export interface ObiettivoNutrizionaleFormDto {
    obiettivo: TipoObiettivo;

    targetCalorie?: number;
    targetProteine?: number;
    targetCarboidrati?: number;
    targetGrassi?: number;
    targetFibre?: number;

    pctProteine?: number;
    pctCarboidrati?: number;
    pctGrassi?: number;

    note?: string;
}

export interface CalcoloErrorResponse {
    campiMancanti: string[];
}
