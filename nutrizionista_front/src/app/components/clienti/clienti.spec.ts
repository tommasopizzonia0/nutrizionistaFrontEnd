import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ClienteComponent } from './clienti';
import { ClienteService } from '../../services/cliente.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';

describe('Clienti', () => {
  let component: ClienteComponent;
  let fixture: ComponentFixture<ClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteComponent],
      providers: [
        provideRouter([]),
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true) }
        },
        {
          provide: ClienteService,
          useValue: {
            allMyClienti: () => of({ contenuto: [], numeroPagina: 0, dimensionePagina: 12, totalePagine: 0, totaleElementi: 0 })
          }
        },
        {
          provide: ThemeService,
          useValue: { isDarkMode$: of(false) }
        },
        {
          provide: SidebarService,
          useValue: { value: false }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClienteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
