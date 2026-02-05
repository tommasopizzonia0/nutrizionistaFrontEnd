import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlimentoBaseDto, AlimentoBaseFormDto } from '../dto/alimento-base.dto';
import { PageResponse } from '../dto/page-response.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoService {
  private apiUrl = 'http://localhost:8080/api/alimenti_base';

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
   * Recupera il dettaglio focalizzato sui Macro (se serve una vista specifica).
   */
  getDettaglioMacro(id: number): Observable<AlimentoBaseDto> {
    return this.http.get<AlimentoBaseDto>(`${this.apiUrl}/${id}/macro`);
  }
}