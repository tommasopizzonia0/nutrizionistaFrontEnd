import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private isDarkModeSubject = new BehaviorSubject<boolean>(this.getInitialTheme());
  isDarkMode$ = this.isDarkModeSubject.asObservable();

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    const mm = typeof window !== 'undefined' ? (window as any).matchMedia : undefined;
    return typeof mm === 'function' ? mm('(prefers-color-scheme: dark)').matches : false;
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkModeSubject.value);
  }

  setTheme(isDarkMode: boolean): void {
    this.isDarkModeSubject.next(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }

  get value(): boolean {
    return this.isDarkModeSubject.value;
  }
}
