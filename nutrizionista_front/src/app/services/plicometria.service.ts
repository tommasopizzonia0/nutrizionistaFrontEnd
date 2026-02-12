import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '../dto/page-response.dto'; 
import { PlicometriaDto, PlicometriaFormDto } from '../dto/plicometria.dto';

@Injectable({
  providedIn: 'root',
})
export class PlicometrieApiService {
  private baseUrl = 'http://localhost:8080/api/plicometrie';

  constructor(private http: HttpClient) {}

  create(form: PlicometriaFormDto): Observable<PlicometriaDto> {
    return this.http.post<PlicometriaDto>(this.baseUrl, form);
  }

  update(form: PlicometriaFormDto): Observable<PlicometriaDto> {
    return this.http.put<PlicometriaDto>(this.baseUrl, form);
  }

  delete(id: number): Observable<void> {
    // controller BE: @DeleteMapping con body IdRequest
    return this.http.request<void>('delete', this.baseUrl, { body: { id } });
  }

  allByCliente(clienteId: number, numeroPagina = 0, dimensionePagina = 10): Observable<PageResponse<PlicometriaDto>> {
    const params = new HttpParams()
      .set('clienteId', clienteId)
      .set('page', numeroPagina)
      .set('size', dimensionePagina);

    return this.http.get<PageResponse<PlicometriaDto>>(this.baseUrl, { params });
  }
}
