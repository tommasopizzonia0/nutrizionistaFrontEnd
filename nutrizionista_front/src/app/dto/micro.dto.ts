export interface MicroDto {
    id: number;
    nome: string;
    unita?: string;
    categoria?: string;
}

export interface MicroFormDto {
    id?: number;
    nome: string;
    unita?: string;
    categoria?: string;
}