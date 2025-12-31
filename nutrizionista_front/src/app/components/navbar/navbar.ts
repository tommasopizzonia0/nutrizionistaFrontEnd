import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
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
  loading = false;
  utente!: UtenteDto;
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
    { id: 'impostazioni', icon: faCog, label: 'Impostazioni', route: '/impostazioni' }
  ];

  constructor(private router: Router, private serviceUtente: UserService, private cdr: ChangeDetectorRef) { 
  }

  ngOnInit(): void {
  
    this.loadUserProfile();

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



    loadUserProfile(): void {
    this.loading = true;
    
    this.serviceUtente.getProfile().subscribe({
      next: (data) => {
        this.utente = data;
        
        if (data.filePathLogo) {
          this.previewUrl = `http://localhost:8080/${data.filePathLogo}`;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore nel caricamento:', err);
        this.errorMessage = 'Errore nel caricamento del profilo';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  navigateToProfile(): void{
    this.router.navigate(['/profilo'])
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