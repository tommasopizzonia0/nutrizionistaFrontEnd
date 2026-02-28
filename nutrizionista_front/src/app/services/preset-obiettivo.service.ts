import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PresetObiettivoDto {
    id?: number;
    nome: string;
    pctProteine: number;
    pctCarboidrati: number;
    pctGrassi: number;
    moltiplicatoreTdee: number;
}

@Injectable({
    providedIn: 'root',
})
export class PresetObiettivoService {
    private baseUrl = 'http://localhost:8080/api/preset-obiettivo';

    constructor(private http: HttpClient) { }

    getAll(): Observable<PresetObiettivoDto[]> {
        return this.http.get<PresetObiettivoDto[]>(this.baseUrl);
    }

    crea(preset: PresetObiettivoDto): Observable<PresetObiettivoDto> {
        return this.http.post<PresetObiettivoDto>(this.baseUrl, preset);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
