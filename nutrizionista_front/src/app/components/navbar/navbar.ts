import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavItem {
  id: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
  isExpanded: boolean = false;
  activeItem: string = 'home';
  isDarkMode: boolean = true;

  @Output() themeChange = new EventEmitter<boolean>();

  navItems: NavItem[] = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
    { id: 'gallery', icon: 'image', label: 'Gallery' },
    { id: 'messages', icon: 'mail', label: 'Messages' }
  ];

  ngOnInit(): void {
    // Carica il tema salvato dal localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'dark';
    }
    // Emetti il tema corrente al componente padre
    this.themeChange.emit(this.isDarkMode);
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  setExpanded(value: boolean): void {
    this.isExpanded = value;
  }

  setActiveItem(itemId: string): void {
    this.activeItem = itemId;
    console.log('Navigazione verso:', itemId);
  }

  isActive(itemId: string): boolean {
    return this.activeItem === itemId;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    
    // Salva il tema nel localStorage
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    
    this.themeChange.emit(this.isDarkMode);
    console.log('Tema cambiato e salvato:', this.isDarkMode ? 'Dark' : 'Light');
  }
}