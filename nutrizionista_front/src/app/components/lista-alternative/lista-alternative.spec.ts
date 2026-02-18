import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaAlternative } from './lista-alternative';

describe('ListaAlternative', () => {
  let component: ListaAlternative;
  let fixture: ComponentFixture<ListaAlternative>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAlternative]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaAlternative);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
