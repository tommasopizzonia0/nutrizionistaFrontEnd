import { Injectable } from '@angular/core';
import { OpenAgendaPayload } from '../dto/appuntamento.dto';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgendaStateService {
  private openSubject = new Subject<OpenAgendaPayload>();
  open$ = this.openSubject.asObservable();

  openCreate(dateIso?: string) {
    this.openSubject.next({ mode: 'create', dateIso });
  }

  openEdit(appuntamentoId: number) {
    this.openSubject.next({ mode: 'edit', appuntamentoId });
  }
}