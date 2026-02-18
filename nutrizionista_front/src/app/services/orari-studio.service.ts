import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrariStudioDto, OrariStudioFormDto } from '../dto/orari-studio.dto';

@Injectable({ providedIn: 'root' })
export class OrariStudioApiService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8080/api/orari_studio';

  getMe() {
    return this.http.get<OrariStudioDto>(`${this.base}/me`);
  }

  upsertMe(payload: OrariStudioFormDto) {
    return this.http.put<OrariStudioDto>(`${this.base}/me`, payload);
  }
}
