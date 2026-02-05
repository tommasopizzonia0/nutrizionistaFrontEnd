import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SchedaDto, SchedaFormDto } from '../dto/scheda.dto';
import { Observable } from 'rxjs';
import { PageResponse } from '../dto/page-response.dto';

@Injectable({
  providedIn: 'root',
})
export class SchedaService {
  private apiUrl = 'http://localhost:8080/api/schede';

  constructor(private http: HttpClient) { }

  // CREA
  create(form: SchedaFormDto): Observable<SchedaDto> {
    return this.http.post<SchedaDto>(this.apiUrl, form);
  }

  // MODIFICA
  update(form: SchedaFormDto): Observable<SchedaDto> {
    return this.http.put<SchedaDto>(this.apiUrl, form);
  }

  // ELIMINA (Corretto: usa l'URL path, non il body)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET BY ID
  getById(id: number): Observable<SchedaDto> {
    return this.http.get<SchedaDto>(`${this.apiUrl}/${id}`);
  }

  // LISTA PAGINATA (Corretto endpoint: /cliente)
  getAllByCliente(clienteId: number, page: number = 0, size: number = 10): Observable<PageResponse<SchedaDto>> {
    const params = new HttpParams()
      .set('clienteId', clienteId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<SchedaDto>>(`${this.apiUrl}/cliente`, { params });
  }

  // ATTIVA (Disattiva le altre e attiva questa), non penso serva
  activate(id: number): Observable<SchedaDto> {
    return this.http.put<SchedaDto>(`${this.apiUrl}/${id}/activate`, {});
  }

  // DUPLICA (Clone rapido per lo stesso cliente)
  duplicate(id: number): Observable<SchedaDto> {
    return this.http.post<SchedaDto>(`${this.apiUrl}/${id}/duplicate`, {});
  }

  // IMPORTA (Clone su un altro cliente)
  importFromCliente(sourceSchedaId: number, targetClienteId: number): Observable<SchedaDto> {
    const params = new HttpParams()
      .set('sourceId', sourceSchedaId.toString())
      .set('targetClienteId', targetClienteId.toString());

    // Nota: passiamo un body vuoto {} perché è una POST
    return this.http.post<SchedaDto>(`${this.apiUrl}/import`, {}, { params });
  }
}