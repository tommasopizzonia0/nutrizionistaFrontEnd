import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteDettaglioComponent } from './cliente-dettaglio';

describe('ClienteDettaglio', () => {
  let component: ClienteDettaglioComponent;
  let fixture: ComponentFixture<ClienteDettaglioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteDettaglioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteDettaglioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
