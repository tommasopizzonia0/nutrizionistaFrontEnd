import { Component } from '@angular/core';
import { HomeComponent } from './components/home/home';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent],
  template: `
    <app-home></app-home>
  `,
  styles: []
})
export class AppComponent {
  title = 'my-app';
  
  constructor() {
    console.log('🚀 APP COMPONENT INITIALIZED');
  }
}