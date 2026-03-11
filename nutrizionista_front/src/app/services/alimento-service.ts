import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlimentoBaseDto, AlimentoBaseFormDto } from '../dto/alimento-base.dto';
import { PageResponse } from '../dto/page-response.dto';
import { PastoTemplateDto, PastoTemplateUpsertDto } from '../dto/pasto-template.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoService {
  private apiUrl = 'http://localhost:8080/api/alimenti_base';
  private pastiTemplatesUrl = 'http://localhost:8080/api/pasti_templates';

  constructor(private http: HttpClient) { }

  /**
   * Cerca alimenti per nome (parziale).
   * Fondamentale per l'autocomplete nella Scheda Dieta.
   */
  search(query: string): Observable<AlimentoBaseDto[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AlimentoBaseDto[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Recupera la lista paginata di tutti gli alimenti.
   * Utile per il pannello di amministrazione alimenti.
   */
  getAll(page: number = 0, size: number = 10): Observable<PageResponse<AlimentoBaseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<AlimentoBaseDto>>(this.apiUrl, { params });
  }

  /**
   * Recupera un singolo alimento per ID.
   */
  getById(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Recupera il dettaglio completo (macro + micro e altri campi).
   */
  getDettaglio(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}/dettaglio`);
  }

  /**
   * Recupera un alimento cercando per nome esatto.
   */
  getByNome(nome: string): Observable<AlimentoBaseDto> {
    const params = new HttpParams().set('nome', nome);
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/byNome`, { params });
  }

  /**
   * Crea un nuovo alimento.
   */
  create(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.post<AlimentoBaseDto>(this.apiUrl, form);
  }

  /**
   * Crea un alimento personale (visibile solo al nutrizionista che lo crea).
   */
  createPersonale(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.post<AlimentoBaseDto>(`${this.apiUrl}/personale`, form);
  }

  /**
   * Aggiorna un alimento esistente.
   */
  update(form: AlimentoBaseFormDto): Observable<AlimentoBaseDto> {
    return this.http.put<AlimentoBaseDto>(this.apiUrl, form);
  }

  /**
   * Elimina un alimento per ID.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Elimina un alimento personale (verifica ownership server-side).
   */
  deletePersonale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/personale/${id}`);
  }

  /**
   * Recupera il dettaglio focalizzato sui Macro (se serve una vista specifica).
   */
  getDettaglioMacro(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}/macro`);
  }

  /**
   * Elenco globale delle categorie di alimenti (uniche).
   * Usato per il filtro categorie del catalogo.
   */
  getCategorie(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorie`);
  }

  getTopAlimenti(limit: number): Observable<AlimentoBaseDto[]> {
    let params = new HttpParams().set('limit', limit.toString());
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
}
