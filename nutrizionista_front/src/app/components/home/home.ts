import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  isDarkMode: boolean = false; // Default a false (chiaro)
  isSidebarCollapsed: boolean = true;

  ngOnInit(): void {
    console.log('🏠 HOME COMPONENT INITIALIZED');
    // Carica il tema salvato all'avvio - sincronizzato con navbar
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Se non c'è tema salvato, controlla preferenze sistema
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    console.log('Home ngOnInit - isDarkMode:', this.isDarkMode);
    // Applica il tema al body (solo per sicurezza)
    this.applyThemeToBody();
  }

  onThemeChange(isDark: boolean): void {
    console.log('🎨 THEME CHANGE RECEIVED IN HOME');
    this.isDarkMode = isDark;
    // NON applicare più il tema al body - lascia che sia la navbar a gestirlo
    console.log('Tema ricevuto nel componente home:', isDark ? 'Dark' : 'Light');
  }

  // Rimuovi completamente questo metodo o lascialo vuoto
  applyThemeToBody(): void {
    // Non fare nulla qui - la navbar gestisce già il tema del body
    console.log('✅ Tema gestito dalla navbar');
  }

  onSidebarToggle(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
  }
}