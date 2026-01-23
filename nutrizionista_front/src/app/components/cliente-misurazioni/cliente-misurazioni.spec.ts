import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteMisurazioniComponent } from './cliente-misurazioni';

describe('ClienteMisurazioni', () => {
  let component: ClienteMisurazioniComponent;
  let fixture: ComponentFixture<ClienteMisurazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteMisurazioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteMisurazioniComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
