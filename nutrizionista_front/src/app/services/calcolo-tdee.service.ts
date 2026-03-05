import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalcoloTdeeDto, CalcoloTdeeFormDto } from '../dto/calcolo-tdee.dto';

@Injectable({
  providedIn: 'root'
})
export class CalcoloTdeeService {

  private apiUrl = 'http://localhost:8080/api/tdee';

  constructor(private http: HttpClient) {}

  calcolaESalva(form: CalcoloTdeeFormDto): Observable<CalcoloTdeeDto> {
    return this.http.post<CalcoloTdeeDto>(this.apiUrl, form);
  }

  getStoricoCliente(clienteId: number): Observable<CalcoloTdeeDto[]> {
    return this.http.get<CalcoloTdeeDto[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

eliminaCalcolo(calcoloId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${calcoloId}`);
  }

eliminaTuttiCalcoliCliente(clienteId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cliente/${clienteId}`);
  }
}