import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMisurazioniComponent } from './lista-misurazioni';

describe('ListaMisurazioni', () => {
  let component: ListaMisurazioniComponent;
  let fixture: ComponentFixture<ListaMisurazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMisurazioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaMisurazioniComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
