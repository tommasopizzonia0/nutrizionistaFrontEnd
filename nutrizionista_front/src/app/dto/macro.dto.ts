export interface MacroDto {
    id: number;
    calorie: number;
    grassi: number;
    proteine: number;
    carboidrati: number;
    fibre?: number;
    zuccheri?: number;
    grassiSaturi?: number;
    sodio?: number;
    alcol?: number;
    acqua?: number;
    sale?: number;
}

export interface MacroFormDto {
    id?: number;
    calorie: number;
    grassi: number;
    proteine: number;
    carboidrati: number;
    fibre?: number;
    zuccheri?: number;
    grassiSaturi?: number;
    sodio?: number;
    alcol?: number;
    acqua?: number;
    sale?: number;
}
