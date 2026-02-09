import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSchede } from './lista-schede';

describe('ListaSchede', () => {
  let component: ListaSchede;
  let fixture: ComponentFixture<ListaSchede>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSchede]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ListaSchede);
    component = fixture.componentInstance;
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
});
