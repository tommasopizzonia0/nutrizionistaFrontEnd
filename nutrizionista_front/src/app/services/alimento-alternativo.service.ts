import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlimentoAlternativoDto, AlimentoAlternativoFormDto, AlimentoAlternativoUpsertDto } from '../dto/alimento-alternativo.dto';

@Injectable({
    providedIn: 'root'
})
export class AlimentoAlternativoService {
    private legacyApiUrl = 'http://localhost:8080/api/alimenti_alternativi';
    private nestedApiBaseUrl = 'http://localhost:8080/api/alimenti_pasto';

    constructor(private http: HttpClient) { }

    /**
     * Crea una nuova alternativa per un alimento nel pasto
     */
    create(form: AlimentoAlternativoFormDto): Observable<AlimentoAlternativoDto> {
        return this.http.post<AlimentoAlternativoDto>(this.legacyApiUrl, form);
    }

    /**
     * Aggiorna un'alternativa esistente (quantità, priorità, note)
     */
    update(form: AlimentoAlternativoFormDto): Observable<AlimentoAlternativoDto> {
        return this.http.put<AlimentoAlternativoDto>(this.legacyApiUrl, form);
    }

    /**
     * Elimina un'alternativa
     */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.legacyApiUrl}/${id}`);
    }

    /**
     * Ottiene una singola alternativa per ID
     */
    getById(id: number): Observable<AlimentoAlternativoDto> {
        return this.http.get<AlimentoAlternativoDto>(`${this.legacyApiUrl}/${id}`);
    }

    /**
     * Lista tutte le alternative per un alimento in un pasto, ordinate per priorità
     */
    listByAlimentoPasto(alimentoPastoId: number): Observable<AlimentoAlternativoDto[]> {
        return this.http.get<AlimentoAlternativoDto[]>(`${this.legacyApiUrl}/alimento_pasto/${alimentoPastoId}`);
    }

    listByAlimentoPastoNested(alimentoPastoId: number): Observable<AlimentoAlternativoDto[]> {
        return this.http.get<AlimentoAlternativoDto[]>(`${this.nestedApiBaseUrl}/${alimentoPastoId}/alternative`);
    }

    createNested(alimentoPastoId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.http.post<AlimentoAlternativoDto>(`${this.nestedApiBaseUrl}/${alimentoPastoId}/alternative`, body);
    }

    updateNested(alimentoPastoId: number, alternativeId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.http.put<AlimentoAlternativoDto>(`${this.nestedApiBaseUrl}/${alimentoPastoId}/alternative/${alternativeId}`, body);
    }

    deleteNested(alimentoPastoId: number, alternativeId: number): Observable<void> {
        return this.http.delete<void>(`${this.nestedApiBaseUrl}/${alimentoPastoId}/alternative/${alternativeId}`);
    }

    bulkUpsertNested(alimentoPastoId: number, items: AlimentoAlternativoUpsertDto[]): Observable<AlimentoAlternativoDto[]> {
        return this.http.put<AlimentoAlternativoDto[]>(`${this.nestedApiBaseUrl}/${alimentoPastoId}/alternative`, items);
    }

    listCompat(alimentoPastoId: number): Observable<AlimentoAlternativoDto[]> {
        return this.listByAlimentoPastoNested(alimentoPastoId).pipe(
            catchError(err => err?.status === 404 ? this.listByAlimentoPasto(alimentoPastoId) : throwError(() => err))
        );
    }

    createCompat(alimentoPastoId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.createNested(alimentoPastoId, body).pipe(
            catchError(err => {
                if (err?.status !== 404) return throwError(() => err);
                const form: AlimentoAlternativoFormDto = {
                    alimentoPastoId,
                    alimentoAlternativoId: body.alimentoAlternativoId,
                    quantita: body.quantita ?? null,
                    priorita: body.priorita ?? undefined,
                    mode: body.mode ?? undefined,
                    manual: body.manual ?? undefined,
                    note: body.note ?? undefined
                };
                return this.create(form);
            })
        );
    }

    updateCompat(alimentoPastoId: number, alternativeId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.updateNested(alimentoPastoId, alternativeId, body).pipe(
            catchError(err => {
                if (err?.status !== 404) return throwError(() => err);
                const form: AlimentoAlternativoFormDto = {
                    id: alternativeId,
                    alimentoPastoId,
                    alimentoAlternativoId: body.alimentoAlternativoId,
                    quantita: body.quantita ?? null,
                    priorita: body.priorita ?? undefined,
                    mode: body.mode ?? undefined,
                    manual: body.manual ?? undefined,
                    note: body.note ?? undefined
                };
                return this.update(form);
            })
        );
    }

    deleteCompat(alimentoPastoId: number, alternativeId: number): Observable<void> {
        return this.deleteNested(alimentoPastoId, alternativeId).pipe(
            catchError(err => err?.status === 404 ? this.delete(alternativeId) : throwError(() => err))
        );
    }

    // === PER-PASTO METHODS ===

    listByPasto(pastoId: number): Observable<AlimentoAlternativoDto[]> {
        return this.http.get<AlimentoAlternativoDto[]>(`${this.legacyApiUrl}/pasto/${pastoId}`);
    }

    createForPasto(pastoId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.http.post<AlimentoAlternativoDto>(`${this.legacyApiUrl}/pasto/${pastoId}`, body);
    }

    updateForPasto(pastoId: number, alternativeId: number, body: AlimentoAlternativoUpsertDto): Observable<AlimentoAlternativoDto> {
        return this.http.put<AlimentoAlternativoDto>(`${this.legacyApiUrl}/pasto/${pastoId}/${alternativeId}`, body);
    }

    deleteForPasto(pastoId: number, alternativeId: number): Observable<void> {
        return this.http.delete<void>(`${this.legacyApiUrl}/pasto/${pastoId}/${alternativeId}`);
    }

    // === BATCH PER-SCHEDA ===

    listByScheda(schedaId: number): Observable<Record<number, AlimentoAlternativoDto[]>> {
        return this.http.get<Record<number, AlimentoAlternativoDto[]>>(
            `${this.legacyApiUrl}/scheda/${schedaId}`
        );
    }
}
