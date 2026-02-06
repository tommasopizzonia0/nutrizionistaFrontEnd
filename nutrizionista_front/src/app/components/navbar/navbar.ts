import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { filter } from 'rxjs/operators';
import {
  faHome,
  faChartLine,
  faBell,
  faChartBar,
  faHeart,
  faWallet,
  faSignOutAlt,
  faMoon,
  faSun,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faUserGroup,
  faFile,
  faCalendar,
  faUtensils,
  faCog,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { UtenteDto } from '../../dto/utente.dto';
import { UserService } from '../../services/user.service';
import { SidebarService } from '../../services/navbar.service';
import { ThemeService } from '../../services/theme.service'; 
import { Observable } from 'rxjs';

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit {

  
  activeItem: string = 'dashboard';
  loading = false;
  utente$!: Observable <UtenteDto>;
  previewUrl: string | null = null;
  errorMessage = '';

  // Icone FontAwesome
  faHome = faHome;
  faChartLine = faChartLine;
  faBell = faBell;
  faChartBar = faChartBar;
  faHeart = faHeart;
  faWallet = faWallet;
  faSignOutAlt = faSignOutAlt;
  faMoon = faMoon;
  faSun = faSun;
  faAngleDoubleLeft = faAngleDoubleLeft;
  faAngleDoubleRight = faAngleDoubleRight;

  menuItems: MenuItem[] = [
    { id: 'dashboard', icon: faHome, label: 'Dashboard', route: '/home' },
    { id: 'clienti', icon: faUserGroup, label: 'Clienti', route: '/clienti' },
    { id: 'agenda', icon: faCalendar, label: 'Agenda', route: '/agenda' },
    { id: 'calcolo', icon: faChartPie, label: 'Calcolo TDEE', route: '/calcolo' },
    { id: 'modelli', icon: faFile, label: 'Modelli', route: '/modelli' },
    { id: 'alimenti', icon: faUtensils, label: 'Alimenti', route: '/alimenti' },
    { id: 'impostazioni', icon: faCog, label: 'Impostazioni', route: '/settings' }
  ];

  constructor(
    private router: Router, 
    private serviceUtente: UserService,  
    public sidebarService: SidebarService,
    public themeService: ThemeService 
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();


    // Rileva il cambio di route e aggiorna l'item attivo
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveItemFromUrl(event.url);
    });

    // Imposta l'item attivo all'avvio in base alla URL corrente
    this.updateActiveItemFromUrl(this.router.url);
  }

  loadUserProfile(): void {
    this.loading = true;
    this.utente$ = this.serviceUtente.getProfile();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profilo']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  setActiveItem(itemId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.activeItem = itemId;
    localStorage.setItem('activeItem', itemId);

    const item = this.menuItems.find(m => m.id === itemId);
    if (item) {
      this.router.navigate([item.route]);
    }
  }

  private updateActiveItemFromUrl(url: string): void {
    const item = this.menuItems.find(m => {
      if (m.route === '/') {
        return url === '/';
      }
      return url.startsWith(m.route);
    });

    if (item) {
      this.activeItem = item.id;
      localStorage.setItem('activeItem', item.id);
    }
  }

  logout(): void {
    console.log('Disconnessione...');
    localStorage.removeItem('token');
    localStorage.removeItem('activeItem');
    localStorage.removeItem('theme');
    localStorage.removeItem('sidebarCollapsed');
    this.router.navigate(['/login']);
  }

    getThemeIcon() {
      return this.themeService.value ? this.faSun : this.faMoon;
    }

}