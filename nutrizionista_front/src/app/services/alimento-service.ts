import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlimentoBaseDto, AlimentoBaseFormDto } from '../dto/alimento-base.dto';
import { PageResponse } from '../dto/page-response.dto';
import { PastoTemplateDto, PastoTemplateUpsertDto } from '../dto/pasto-template.dto';
import { RicettaDto } from '../dto/ricetta.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoService {
  private apiUrl = 'http://localhost:8080/api/alimenti_base';
  private pastiTemplatesUrl = 'http://localhost:8080/api/pasti_templates';
  private ricetteUrl = 'http://localhost:8080/api/ricette';

  constructor(private http: HttpClient) { }

  search(query: string): Observable<AlimentoBaseDto[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AlimentoBaseDto[]>(`${this.apiUrl}/search`, { params });
  }

  getAll(page: number = 0, size: number = 10): Observable<PageResponse<AlimentoBaseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<AlimentoBaseDto>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}`);
  }

  getDettaglio(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}/dettaglio`);
  }

  getByNome(nome: string): Observable<AlimentoBaseDto> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/byNome`, { params });
  }

  create(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.post<AlimentoBaseDto>(this.apiUrl, form);
  }

  createPersonale(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.post<AlimentoBaseDto>(`${this.apiUrl}/personale`, form);
  }

  update(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.put<AlimentoBaseDto>(this.apiUrl, form);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletePersonale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/personale/${id}`);
  }

  getDettaglioMacro(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}/macro`);
  }

  getCategorie(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorie`);
  }

  getTopAlimenti(limit: number): Observable<AlimentoBaseDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AlimentoBaseDto[]>(`${this.apiUrl}/piu-utilizzati`, { params });
  }

  /* ═══════════════════════════════════════════
   *  PREFERITI
   * ═══════════════════════════════════════════ */

  getPreferiti(): Observable<AlimentoBaseDto[]> {
    return this.http.get<AlimentoBaseDto[]>(`${this.apiUrl}/preferiti`);
  }

  addPreferito(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/preferiti/${id}`, {});
  }

  removePreferito(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/preferiti/${id}`);
  }

  /* ═══════════════════════════════════════════
   *  PASTI TEMPLATES
   * ═══════════════════════════════════════════ */

  getPastiTemplates(): Observable<PastoTemplateDto[]> {
    return this.http.get<PastoTemplateDto[]>(this.pastiTemplatesUrl);
  }

  createPastoTemplate(payload: PastoTemplateUpsertDto): Observable<PastoTemplateDto> {
    return this.http.post<PastoTemplateDto>(this.pastiTemplatesUrl, payload);
  }

  updatePastoTemplate(id: number, payload: PastoTemplateUpsertDto): Observable<PastoTemplateDto> {
    return this.http.put<PastoTemplateDto>(`${this.pastiTemplatesUrl}/${id}`, payload);
  }

  deletePastoTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.pastiTemplatesUrl}/${id}`);
  }

  /* ═══════════════════════════════════════════
   *  RICETTE SUGGERITE
   * ═══════════════════════════════════════════ */

  /** Recupera tutte le ricette pubbliche con ingredienti e macro calcolati. */
  getRicette(): Observable<RicettaDto[]> {
    return this.http.get<RicettaDto[]>(this.ricetteUrl);
  }

  /**
   * Importa una ricetta come PastoTemplate personale del nutrizionista.
   * Il backend restituisce il PastoTemplateDto appena creato.
   */
  importRicettaAsTemplate(ricettaId: number): Observable<PastoTemplateDto> {
    return this.http.post<PastoTemplateDto>(`${this.ricetteUrl}/${ricettaId}/import-template`, {});
  }
}
