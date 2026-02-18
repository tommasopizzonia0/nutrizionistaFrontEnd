import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarComponent } from './navbar';
import { UserService } from '../../services/user.service';
import { SidebarService } from '../../services/navbar.service';
import { ThemeService } from '../../services/theme.service';



describe('Navbar', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    const routerEvents$ = new Subject<any>();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            url: '/home',
            events: routerEvents$.asObservable(),
            navigate: () => Promise.resolve(true)
          }
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

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    routerEvents$.next(new NavigationEnd(1, '/home', '/home'));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
