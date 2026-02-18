import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoAlimenti } from './catalogo-alimenti';

describe('CatalogoAlimenti', () => {
  let component: CatalogoAlimenti;
  let fixture: ComponentFixture<CatalogoAlimenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoAlimenti]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CatalogoAlimenti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ordina alfabeticamente ignorando maiuscole', () => {
    const items = [
      { nome: 'banana' },
      { nome: 'Apple' },
      { nome: 'carota' }
    ] as any;

    const sorted = (component as any).sortByNome(items);

    expect(sorted.map((x: any) => x.nome)).toEqual(['Apple', 'banana', 'carota']);
  });
});
