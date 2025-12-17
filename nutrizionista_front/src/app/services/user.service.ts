import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // ✅ Questo lo rende disponibile globalmente
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/utenti';

  constructor(private http: HttpClient) {}

  /**
   * Ottiene il profilo dell'utente corrente
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profilo`);
  }

  /**
   * Aggiorna il profilo dell'utente corrente (senza ruolo e password)
   */
  updateMyProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/myprofile`, userData);
  }

  /**
   * Aggiorna la password dell'utente corrente
   */
  updatePassword(passwordData: any): Observable<any> {
    // Endpoint da verificare - potrebbe essere /api/auth/reset-password
    return this.http.put(`${this.apiUrl}/password`, passwordData);
  }

  /**
   * Carica il logo/immagine profilo
   */
    updateLogo(formData: FormData): Observable<any> {
      return this.http.post(`${this.apiUrl}/logo`, formData);
    }


  /**
   * Elimina il profilo dell'utente corrente
   */
  deleteMyProfile(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/profilo`);
  }

  /**
   * Ottiene un utente per ID (admin)
   */
  getById(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/byId`, { id });
  }

  /**
   * Lista paginata utenti (admin)
   */
  list(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  /**
   * Lista completa utenti (admin)
   */
  listAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tutti`);
  }

  /**
   * Crea nuovo utente (admin)
   */
  create(userData: any): Observable<any> {
    return this.http.post(this.apiUrl, userData);
  }

  /**
   * Aggiorna utente (admin)
   */
  update(userData: any): Observable<any> {
    return this.http.put(this.apiUrl, userData);
  }

  /**
   * Elimina utente per ID (admin)
   */
  delete(id: number): Observable<void> {
    return this.http.request<void>('delete', this.apiUrl, {
      body: { id }
    });
  }
}