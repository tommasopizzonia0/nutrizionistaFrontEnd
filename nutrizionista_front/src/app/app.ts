import { Component, EventEmitter, Output } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'my-app';
  isDarkMode = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();

  isCollapsed: boolean = false;

  constructor(private themeService: ThemeService) {
    console.log('🚀 APP COMPONENT INITIALIZED');
    

    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  onThemeChange(isDark: boolean): void {
    this.isDarkMode = isDark;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }
}