import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PastoDto, PastoFormDto } from '../dto/pasto.dto';
import { PageResponse } from '../dto/page-response.dto'; // Assicurati di importare PageResponse

@Injectable({
  providedIn: 'root'
})
export class PastoService {
  private apiUrl = 'http://localhost:8080/api/pasti';

  constructor(private http: HttpClient) { }

  /**
   * Crea un nuovo pasto
   */
  create(form: PastoFormDto): Observable<PastoDto> {
    return this.http.post<PastoDto>(this.apiUrl, form);
  }

  /**
   * Aggiorna un pasto esistente
   */
  update(form: PastoFormDto): Observable<PastoDto> {
    return this.http.put<PastoDto>(this.apiUrl, form);
  }

  /**
   * Elimina un pasto
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Ottiene il dettaglio di un singolo pasto
   */
  getById(id: number): Observable<PastoDto> {
    return this.http.get<PastoDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Ottiene tutti i pasti creati dal nutrizionista loggato (Paginati)
   * Corrisponde a: GET /api/pasti?page=0&size=10
   */
  getAllMyPasti(page: number = 0, size: number = 10): Observable<PageResponse<PastoDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<PastoDto>>(this.apiUrl, { params });
  }
}