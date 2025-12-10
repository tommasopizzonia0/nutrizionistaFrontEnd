import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ClienteComponent } from './components/clienti/clienti';
import { Login } from './components/login/login';

export const routes: Routes = [
  {path: '', component: Login},

    {
    path: 'login',
    component: Login
  },


  {
    path: 'home',
    component: HomeComponent
  },
   { 
    path: 'clienti', 
    component: ClienteComponent 
  }
];
