import { PastoDto } from './pasto.dto';

export type PastoApplyTemplateMode = 'MERGE' | 'REPLACE';
export type PastoApplyTemplateRestrizioniPolicy = 'SKIP_WARNINGS' | 'FAIL_ON_WARNING';

export interface PastoApplyTemplateRequest {
  templateId: number;
  mode?: PastoApplyTemplateMode;
  restrizioniPolicy?: PastoApplyTemplateRestrizioniPolicy;
}

export interface PastoApplyTemplateSkippedItemDto {
  type: string;
  alimentoId?: number | null;
  alternativaId?: number | null;
  message?: string | null;
}

export interface PastoApplyTemplateStatsDto {
  addedAlimenti: number;
  updatedAlimenti: number;
  removedAlimenti: number;
  addedAlternative: number;
  updatedAlternative: number;
  removedAlternative: number;
}

export interface PastoApplyTemplateResultDto {
  pasto: PastoDto;
  stats: PastoApplyTemplateStatsDto;
  skipped: PastoApplyTemplateSkippedItemDto[];
}

