import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlimentoPastoDto } from '../dto/alimento-pasto.dto';
import { DisplayNameRequest } from '../dto/display-name.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoPastoDisplayNameService {
  private apiUrl = 'http://localhost:8080/api/schede';

  constructor(private http: HttpClient) { }

  set(schedaId: number, alimentoPastoId: number, nome: string): Observable<AlimentoPastoDto> {
    const body: DisplayNameRequest = { nome };
    return this.http.put<AlimentoPastoDto>(`${this.apiUrl}/${schedaId}/alimenti-pasto/${alimentoPastoId}/display-name`, body);
  }

  delete(schedaId: number, alimentoPastoId: number): Observable<AlimentoPastoDto> {
    return this.http.delete<AlimentoPastoDto>(`${this.apiUrl}/${schedaId}/alimenti-pasto/${alimentoPastoId}/display-name`);
  }
}

