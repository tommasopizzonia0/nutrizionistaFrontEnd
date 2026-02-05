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
});
