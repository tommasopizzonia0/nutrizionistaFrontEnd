import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
    ObiettivoNutrizionaleDto,
    ObiettivoNutrizionaleFormDto,
    CalcoloErrorResponse
} from '../dto/obiettivo-nutrizionale.dto';

@Injectable({
    providedIn: 'root',
})
export class ObiettivoService {
    private baseUrl = 'http://localhost:8080/api/clienti';

    constructor(private http: HttpClient) { }

    get(clienteId: number): Observable<ObiettivoNutrizionaleDto> {
        return this.http.get<ObiettivoNutrizionaleDto>(
            `${this.baseUrl}/${clienteId}/obiettivo`
        );
    }

    creaOAggiorna(clienteId: number, form: ObiettivoNutrizionaleFormDto): Observable<ObiettivoNutrizionaleDto> {
        return this.http.post<ObiettivoNutrizionaleDto>(
            `${this.baseUrl}/${clienteId}/obiettivo`,
            form
        );
    }

    calcola(clienteId: number): Observable<ObiettivoNutrizionaleDto> {
        return this.http.post<ObiettivoNutrizionaleDto>(
            `${this.baseUrl}/${clienteId}/obiettivo/calcola`,
            {}
        );
    }

    delete(clienteId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${clienteId}/obiettivo`
        );
    }
}
