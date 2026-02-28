import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { OpenAgendaPayload } from '../dto/appuntamento.dto';

@Injectable({ providedIn: 'root' })
export class AgendaStateService {

  private openSubject = new Subject<OpenAgendaPayload>();
  open$ = this.openSubject.asObservable();

  // ✅ dateIso DEVE essere string (mai undefined)
  openCreate(dateIso: string): void {
    this.openSubject.next({ mode: 'create', dateIso });
  }

  openEdit(appuntamentoId: number): void {
    this.openSubject.next({ mode: 'edit', appuntamentoId });
  }
}