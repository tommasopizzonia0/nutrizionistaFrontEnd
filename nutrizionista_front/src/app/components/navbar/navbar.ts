import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
  faAngleDoubleRight
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  id: string;
  icon: any;
  label: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {

  isCollapsed: boolean = false;
  isDarkMode: boolean = false;
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

  @Output() themeChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    { id: 'dashboard',  icon: faHome,        label: 'Dashboard' },
    { id: 'ricavi',     icon: faChartLine,   label: 'Ricavi' },
    { id: 'notifiche',  icon: faBell,        label: 'Notifiche' },
    { id: 'analitiche', icon: faChartBar,    label: 'Analitiche' },
    { id: 'preferiti',  icon: faHeart,       label: 'Preferiti' },
    { id: 'portafoglio',icon: faWallet,      label: 'Portafoglio' }
  ];

  ngOnInit(): void {
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

    // Item attivo
    const savedActiveItem = localStorage.getItem('activeItem');
    if (savedActiveItem) {
      this.activeItem = savedActiveItem;
    }
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

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  setActiveItem(itemId: string): void {
    this.activeItem = itemId;
    localStorage.setItem('activeItem', itemId);
  }

  logout(): void {
    console.log('Disconnessione...');
    // Aggiungi qui la logica di logout
  }

  getThemeIcon() {
    return this.isDarkMode ? this.faSun : this.faMoon;
  }
}