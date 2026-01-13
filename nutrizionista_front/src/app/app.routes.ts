import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ClienteComponent } from './components/clienti/clienti';
import { Login } from './components/login/login';
import { ClienteDettaglioComponent } from './components/cliente-dettaglio/cliente-dettaglio';
import { UserProfileComponent } from './components/user-profile/user-profile';

//usiamo il data routing, soluzione che mi hanno consigliato


export const routes: Routes = [
  {path: '', component: Login},

  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login),
    data: { showNavbar: false }
  },


  {
    path: 'home',
    component: HomeComponent
  },
   { 
    path: 'clienti', 
    component: ClienteComponent 
  },
  
  { path: 'clienti/:id', 
    component: ClienteDettaglioComponent 
  },

  {
    path: 'profilo',
    component: UserProfileComponent
  }
];
