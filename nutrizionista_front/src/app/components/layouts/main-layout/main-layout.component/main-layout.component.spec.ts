import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { MainLayoutComponent } from './main-layout.component';
import { UserService } from '../../../../services/user.service';
import { SidebarService } from '../../../../services/navbar.service';
import { ThemeService } from '../../../../services/theme.service';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        {
          provide: Router,
          useValue: { url: '/home', events: of(), navigate: () => Promise.resolve(true) }
        },
        {
          provide: UserService,
          useValue: { getProfile: () => of({ id: 1 }) }
        },
        {
          provide: SidebarService,
          useValue: { value: false, toggle: () => undefined }
        },
        {
          provide: ThemeService,
          useValue: { isDarkMode$: of(false), toggleTheme: () => undefined }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
