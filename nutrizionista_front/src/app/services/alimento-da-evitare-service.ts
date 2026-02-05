import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from '../dto/page-response.dto';
import { AlimentoDaEvitareDto, AlimentoDaEvitareFormDto } from '../dto/alimento-da-evitare.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoDaEvitareService {
  private apiUrl = 'http://localhost:8080/api/alimenti_da_evitare';

  constructor(private http: HttpClient) { }

  /**
   * Aggiunge un alimento alla lista nera del cliente.
   */
  create(form: AlimentoDaEvitareFormDto): Observable<AlimentoDaEvitareDto> {
    return this.http.post<AlimentoDaEvitareDto>(this.apiUrl, form);
  }

  /**
   * Aggiorna una restrizione esistente (raramente usato, ma presente).
   */
  update(form: AlimentoDaEvitareFormDto): Observable<AlimentoDaEvitareDto> {
    return this.http.put<AlimentoDaEvitareDto>(this.apiUrl, form);
  }

  /**
   * Rimuove un alimento dalla lista (es. il cliente non è più allergico o cambia idea).
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Ottiene tutti gli alimenti da evitare per uno specifico cliente (Paginati).
   * Endpoint: GET /api/alimenti_da_evitare/cliente/{clienteId}
   */
  getAllByCliente(clienteId: number, page: number = 0, size: number = 10): Observable<PageResponse<AlimentoDaEvitareDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<AlimentoDaEvitareDto>>(`${this.apiUrl}/cliente/${clienteId}`, { params });
  }

  /**
   * Ottiene il dettaglio singolo (opzionale).
   */
  getById(id: number): Observable<AlimentoDaEvitareDto> {
    return this.http.get<AlimentoDaEvitareDto>(`${this.apiUrl}/${id}`);
  }
}