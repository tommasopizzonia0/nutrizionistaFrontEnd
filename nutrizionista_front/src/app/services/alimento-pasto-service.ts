import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PastoDto } from '../dto/pasto.dto';
import { AlimentoBaseDto } from '../dto/alimento-base.dto';
import { AlimentoPastoRequest } from '../dto/alimento-pasto.dto';

@Injectable({
  providedIn: 'root'
})
export class AlimentoPastoService {
  // Assicurati che la porta e il path coincidano col tuo backend
  private apiUrl = 'http://localhost:8080/api/alimenti_pasto';

  constructor(private http: HttpClient) { }

  /**
   * Associa un alimento a un pasto (POST).
   * Restituisce il PastoDto aggiornato (con ricalcolo calorie e lista nuovi alimenti).
   * Gestisce il flag 'forzaInserimento' se necessario.
   */
  associa(req: AlimentoPastoRequest): Observable<PastoDto> {
    return this.http.post<PastoDto>(this.apiUrl, req);
  }

  /**
   * Rimuove un alimento da un pasto (DELETE).
   * Endpoint: DELETE /api/alimenti_pasto?pastoId=...&alimentoId=...
   */
  remove(pastoId: number, alimentoId: number): Observable<PastoDto> {
    // Costruiamo i parametri query string per matchare @RequestParam del Java
    const params = new HttpParams()
      .set('pastoId', pastoId.toString())
      .set('alimentoId', alimentoId.toString());

    return this.http.delete<PastoDto>(this.apiUrl, { params });
  }

  /**
   * Aggiorna la quantità di un alimento (PUT).
   * Richiede { pasto: {id}, alimento: {id}, quantita: N }
   * Restituisce il PastoDto aggiornato con i nuovi macro totali.
   */
  updateQuantita(req: AlimentoPastoRequest): Observable<PastoDto> {
    return this.http.put<PastoDto>(this.apiUrl, req);
  }

  /**
   * Ottiene la lista "semplice" degli alimenti in un pasto.
   * Utile se serve solo l'elenco dei cibi senza dettagli del pasto.
   */
  listByPasto(pastoId: number): Observable<AlimentoBaseDto[]> {
    return this.http.get<AlimentoBaseDto[]>(`${this.apiUrl}/byPasto/${pastoId}`);
  }
}
