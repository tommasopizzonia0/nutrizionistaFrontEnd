import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteDto, ClienteFormDto } from '../dto/cliente.dto';
import { PageResponse } from '../dto/page-response.dto';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8080/api/clienti';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔑 Token nel servizio:', token ? 'PRESENTE' : 'ASSENTE');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  allMyClienti(page: number = 0, size: number = 8): Observable<PageResponse<ClienteDto>> {
    return this.http.get<PageResponse<ClienteDto>>(
      `${this.apiUrl}?page=${page}&size=${size}`,
      { headers: this.getHeaders() }
    );
  }

  create(form: ClienteFormDto): Observable<ClienteDto> {
    return this.http.post<ClienteDto>(this.apiUrl, form, { headers: this.getHeaders() });
  }

  update(form: ClienteFormDto): Observable<ClienteDto> {
    return this.http.put<ClienteDto>(this.apiUrl, form, { headers: this.getHeaders() });
  }

  deleteMyCliente(id: number): Observable<void> {
    return this.http.request<void>('DELETE', `${this.apiUrl}/mio`, {
      body: { id },
      headers: this.getHeaders()
    });
  }

  dettaglio(id: number): Observable<ClienteDto> {
    return this.http.post<ClienteDto>(
      `${this.apiUrl}/dettaglio`,
      { id },
      { headers: this.getHeaders() }
    );
  }

}