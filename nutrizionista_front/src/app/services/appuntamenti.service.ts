import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CalendarEventDto, AppuntamentoFormDto, AppuntamentoDto } from '../dto/appuntamento.dto';

@Injectable({
  providedIn: 'root',
})
export class AppuntamentiApiService {
  private baseUrl = 'http://localhost:8080/api/appuntamenti';

  constructor(private http: HttpClient) {}

  getMyEvents(start: string, end: string): Observable<CalendarEventDto[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<CalendarEventDto[]>(`${this.baseUrl}/me`, { params });
  }

  create(form: AppuntamentoFormDto): Observable<AppuntamentoDto> {
    return this.http.post<AppuntamentoDto>(this.baseUrl, form);
  }

  update(id: number, form: AppuntamentoFormDto): Observable<AppuntamentoDto> {
    return this.http.put<AppuntamentoDto>(`${this.baseUrl}/${id}`, form);
  }

  getById(id: number): Observable<AppuntamentoDto> {
    return this.http.get<AppuntamentoDto>(`${this.baseUrl}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  move(id: number, startIso: string, endIso?: string | null): Observable<AppuntamentoDto> {
    let params = new HttpParams().set('start', startIso);
    if (endIso) params = params.set('end', endIso);
    return this.http.patch<AppuntamentoDto>(`${this.baseUrl}/${id}/move`, null, { params });
  }
}