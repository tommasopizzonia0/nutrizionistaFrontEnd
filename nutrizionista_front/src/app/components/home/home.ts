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
  isDarkMode: boolean = true;

  ngOnInit(): void {
    console.log('🏠 HOME COMPONENT INITIALIZED');
    // Carica il tema salvato all'avvio
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      this.isDarkMode = savedTheme === 'dark';
    }
    console.log('Home ngOnInit - isDarkMode:', this.isDarkMode);
    // Applica il tema al body
    this.applyThemeToBody();
  }

  onThemeChange(isDark: boolean): void {
    console.log('🎨 THEME CHANGE RECEIVED IN HOME');
    this.isDarkMode = isDark;
    this.applyThemeToBody();
    console.log('Tema ricevuto nel componente home:', isDark ? 'Dark' : 'Light');
    console.log('isDarkMode value:', this.isDarkMode);
  }

  applyThemeToBody(): void {
    const bodyColor = this.isDarkMode ? '#1e1e1e' : '#ffffff';
    document.body.style.backgroundColor = bodyColor;
    console.log('✅ Body background impostato a:', bodyColor);
    console.log('✅ document.body.style:', document.body.style.backgroundColor);
  }
}