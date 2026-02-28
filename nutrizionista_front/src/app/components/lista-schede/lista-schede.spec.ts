import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ListaSchede } from './lista-schede';
import { SchedaService } from '../../services/scheda-service';
import { SchedaCacheService } from '../../services/scheda-cache.service';

describe('ListaSchede', () => {
  let component: ListaSchede;
  let fixture: ComponentFixture<ListaSchede>;

  beforeEach(async () => {
    const schedaServiceStub = {
      update: (_: any) => of({ id: 1, nome: 'Nuovo Nome', cliente: { id: 1 }, attiva: false, dataCreazione: '2026-02-08' })
    };
    const schedaCacheStub = {
      invalidate: (_: number) => { }
    };

    await TestBed.configureTestingModule({
      imports: [ListaSchede],
      providers: [
        { provide: SchedaService, useValue: schedaServiceStub },
        { provide: SchedaCacheService, useValue: schedaCacheStub }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListaSchede);
    component = fixture.componentInstance;
    component.clienteId = 1;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ordina per dataCreazione desc e id desc a parità di data', () => {
    const input: any[] = [
      { id: 1, dataCreazione: '2026-02-08', nome: 'A', cliente: {}, attiva: false },
      { id: 2, dataCreazione: '2026-02-08', nome: 'B', cliente: {}, attiva: false },
      { id: 3, dataCreazione: '2026-02-07', nome: 'C', cliente: {}, attiva: false },
    ];

    const sorted = (component as any).sortSchede(input);

    expect(sorted.map((s: any) => s.id)).toEqual([2, 1, 3]);
  });

  it('non salva se nome non valido', () => {
    const scheda: any = { id: 1, dataCreazione: '2026-02-08', nome: 'Vecchio', cliente: { id: 1 }, attiva: false };
    component.schede = [scheda];
    component.startRename(scheda, new MouseEvent('dblclick'));
    component.editNome = 'a';
    const updateSpy = vi.spyOn(TestBed.inject(SchedaService) as any, 'update');
    component.confirmRename(scheda, new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.editError).toBeTruthy();
  });

  it('salva nome valido e aggiorna lista', async () => {
    const scheda: any = { id: 1, dataCreazione: '2026-02-08', nome: 'Vecchio', cliente: { id: 1 }, attiva: false, numeroPasti: 3 };
    component.schede = [scheda];
    const emitSpy = vi.spyOn(component.schedaRenamed as any, 'emit');
    component.startRename(scheda, new MouseEvent('dblclick'));
    component.editNome = 'Nuovo Nome';
    component.confirmRename(scheda, new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    expect(component.schede[0].nome).toBe('Nuovo Nome');
    expect(component.schede[0].numeroPasti).toBe(3);
    expect(emitSpy).toHaveBeenCalled();
  });
});
