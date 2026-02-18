import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MealCreateRequest, MealDto, MealUpdateRequest } from '../dto/meal.dto';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = 'http://localhost:8080/api/meals';

  constructor(private http: HttpClient) { }

  create(req: MealCreateRequest): Observable<MealDto> {
    return this.http.post<MealDto>(this.apiUrl, req);
  }

  update(id: number, req: MealUpdateRequest): Observable<MealDto> {
    return this.http.put<MealDto>(`${this.apiUrl}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

