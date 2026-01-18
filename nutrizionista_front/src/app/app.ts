import { Component, EventEmitter, Output } from '@angular/core';
import { RouterOutlet } from '@angular/router';


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

  constructor() {
    console.log('🚀 APP COMPONENT INITIALIZED');
  }

  onThemeChange(isDark: boolean): void {
    this.isDarkMode = isDark;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }
}