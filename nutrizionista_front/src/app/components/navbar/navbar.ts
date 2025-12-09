import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
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
  faUserGroup
} from '@fortawesome/free-solid-svg-icons';

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
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {

  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Output() themeChange = new EventEmitter<boolean>();
  @Input() isCollapsed: boolean = true; // <- permette il binding
  @Input() isDarkMode: boolean = false;

  activeItem: string = 'dashboard';

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
    { id: 'dashboard',  icon: faHome,        label: 'Dashboard',  route: '/' },
    { id: 'clienti',    icon: faUserGroup,   label: 'Clienti',    route: '/clienti' },
    { id: 'notifiche',  icon: faBell,        label: 'Notifiche',  route: '/notifiche' },
    { id: 'analitiche', icon: faChartBar,    label: 'Analitiche', route: '/analitiche' },
    { id: 'preferiti',  icon: faHeart,       label: 'Preferiti',  route: '/preferiti' },
    { id: 'portafoglio',icon: faWallet,      label: 'Portafoglio',route: '/portafoglio' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Carica lo stato della sidebar dal localStorage
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState !== null) {
      this.isCollapsed = savedCollapsedState === 'true';
    } else {
      // Default: sempre ristretta all'avvio
      this.isCollapsed = true;
      localStorage.setItem('sidebarCollapsed', 'true');
    }
    
    // Emetti lo stato iniziale della sidebar
    this.sidebarToggle.emit(this.isCollapsed);

    // Controlla tema salvato
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Default al tema del sistema
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    this.applyTheme();
    this.themeChange.emit(this.isDarkMode);

    // Rileva il cambio di route e aggiorna l'item attivo
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateActiveItemFromUrl(event.url);
    });
    
    // Imposta l'item attivo all'avvio in base alla URL corrente
    this.updateActiveItemFromUrl(this.router.url);
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
    this.themeChange.emit(this.isDarkMode);
  }

  applyTheme(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#1e1e1e';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8faf9';
    }
  }
  toggleSidebar() {
  this.isCollapsed = !this.isCollapsed;
  this.sidebarToggle.emit(this.isCollapsed);
}

  setActiveItem(itemId: string, event?: MouseEvent): void {
    // Previeni la propagazione dell'evento
    if (event) {
      event.stopPropagation();
    }
    
    this.activeItem = itemId;
    localStorage.setItem('activeItem', itemId);
    
    // Naviga alla route corrispondente SENZA modificare lo stato della sidebar
    const item = this.menuItems.find(m => m.id === itemId);
    if (item) {
      this.router.navigate([item.route]);
    }
  }

  private updateActiveItemFromUrl(url: string): void {
    // Trova l'item del menu che corrisponde alla URL corrente
    const item = this.menuItems.find(m => {
      // Se la route è '/', controlla che l'URL sia esattamente '/'
      if (m.route === '/') {
        return url === '/';
      }
      // Altrimenti controlla che l'URL inizi con la route
      return url.startsWith(m.route);
    });
    
    if (item) {
      this.activeItem = item.id;
      localStorage.setItem('activeItem', item.id);
    }
  }

  logout(): void {
    console.log('Disconnessione...');
    // Rimuovi token e dati dal localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('activeItem');
    localStorage.removeItem('theme');
    localStorage.removeItem('sidebarCollapsed');
    
    // Naviga alla pagina di login (se esiste)
    this.router.navigate(['/login']);
  }

  getThemeIcon() {
    return this.isDarkMode ? this.faSun : this.faMoon;
  }
  
}