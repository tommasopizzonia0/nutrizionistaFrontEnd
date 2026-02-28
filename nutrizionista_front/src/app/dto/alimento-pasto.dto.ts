import { AlimentoBaseDto } from "./alimento-base.dto";
import { AlimentoAlternativoDto } from "./alimento-alternativo.dto";
import { PastoDto } from "./pasto.dto";

// PER LETTURA (Output dal server)
export interface AlimentoPastoDto {
    id: number;
    alimento: AlimentoBaseDto; // Qui serve l'oggetto completo per mostrare il nome
    pasto?: PastoDto;
    quantita: number;
    nomeCustom?: string | null;
    nomeVisualizzato?: string | null;
    alternative?: AlimentoAlternativoDto[];
}

// PER SCRITTURA (Input verso il server - Create/Update)
export interface AlimentoPastoRequest {
    // Non serve 'id' dell'associazione, usiamo la coppia pasto+alimento
    pasto: { id: number };
    alimento: { id: number };
    quantita: number;
    forzaInserimento?: boolean;
}
