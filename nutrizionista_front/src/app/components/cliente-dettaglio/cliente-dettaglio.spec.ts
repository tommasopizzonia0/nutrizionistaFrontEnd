import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ClienteDettaglioComponent } from './cliente-dettaglio';
import { ClienteService } from '../../services/cliente.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';
import { SchedaService } from '../../services/scheda-service';

describe('ClienteDettaglio', () => {
  let component: ClienteDettaglioComponent;
  let fixture: ComponentFixture<ClienteDettaglioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteDettaglioComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } }
        },
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) }
        },
        {
          provide: ClienteService,
          useValue: { dettaglio: () => of({ id: 1, nome: 'Mario', cognome: 'Rossi' }) }
        },
        {
          provide: ThemeService,
          useValue: { isDarkMode$: of(false) }
        },
        {
          provide: SidebarService,
          useValue: { value: false }
        },
        {
          provide: SchedaService,
          useValue: {}
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClienteDettaglioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('propaga nome scheda selezionata per la vista modifica', () => {
    component.onSchedaSelezionata({ id: 10, nome: 'Dieta Ipocalorica', cliente: { id: 1 } as any, attiva: false, dataCreazione: '2026-02-16' } as any);
    expect(component.schedaSelezionataId).toBe(10);
    expect(component.schedaSelezionataNome).toBe('Dieta Ipocalorica');
  });
});
