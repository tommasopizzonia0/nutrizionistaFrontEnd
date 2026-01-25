import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MisurazioneAntropometricaDto,
  MisurazioneAntropometricaFormDto,
  PageIt,
  PageResponse
} from '../dto/misurazione-antropometrica.dto';

@Injectable({
  providedIn: 'root'
})
export class MisurazioneAntropometricaService {
  private apiUrl = 'http://localhost:8080/api/misurazioni_antropometriche';

  constructor(private http: HttpClient) { }

  create(form: MisurazioneAntropometricaFormDto): Observable<MisurazioneAntropometricaDto> {
    return this.http.post<MisurazioneAntropometricaDto>(this.apiUrl, form);
  }

  update(form: MisurazioneAntropometricaFormDto): Observable<MisurazioneAntropometricaDto> {
    return this.http.put<MisurazioneAntropometricaDto>(this.apiUrl, form);
  }

  delete(id: number): Observable<void> {
    return this.http.request<void>('delete', this.apiUrl, { body: { id } });
  }

  getAllByCliente(clienteId: number, page: number = 0, size: number = 10) {
    const params = new HttpParams()
      .set('clienteId', clienteId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageIt<MisurazioneAntropometricaDto>>(this.apiUrl, { params });
  }


  mapFormToDto(formValues: any, clienteId: number): MisurazioneAntropometricaFormDto {
    return {
      spalle: formValues.spalle || null,
      vita: formValues.addome || null,
      fianchi: formValues.fianchi || null,
      torace: formValues.torace || null,
      gambaS: formValues.gambaSx || null,
      gambaD: formValues.gambaDx || null,
      bicipiteS: formValues.bicipiteSx || null,
      bicipiteD: formValues.bicipiteDx || null,
      dataMisurazione: new Date().toISOString().split('T')[0],
      cliente: { id: clienteId }
    };
  }
}
