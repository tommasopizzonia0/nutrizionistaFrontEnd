import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteDto, ClienteFormDto } from '../dto/cliente.dto';
import { PageResponse } from '../dto/page-response.dto';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = 'http://localhost:8080/api/clienti';

  constructor(private http: HttpClient) {}

  // Creazione cliente
  create(form: ClienteFormDto): Observable<ClienteDto> {
    return this.http.post<ClienteDto>(this.apiUrl, form);
  }

  // Modifica cliente
  update(form: ClienteFormDto): Observable<ClienteDto> {
    return this.http.put<ClienteDto>(this.apiUrl, form);
  }

  // Eliminazione cliente generica (admin)
  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiUrl, { body: { id } });
  }

  // Eliminazione cliente proprio (nutrizionista)
  deleteMyCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mio`, { body: { id } });
  }

  // Recupera lista clienti paginata
  allMyClienti(page: number = 0, size: number = 10): Observable<PageResponse<ClienteDto>> {
    const url = `${this.apiUrl}?page=${page}&size=${size}`;
    return this.http.get<PageResponse<ClienteDto>>(url);
  }

  // Recupera cliente per ID
  getById(id: number): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/byId`, { params: { id: id.toString() } });
  }

  // Recupera cliente per nome
  getByNome(nome: string): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/byNome`, { params: { nome } });
  }

  // Recupera cliente per cognome
  getByCognome(cognome: string): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/byCognome`, { params: { cognome } });
  }

  // Recupera dettaglio cliente completo
  dettaglio(id: number): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/dettaglio`, { params: { id: id.toString() } });
  }
}
