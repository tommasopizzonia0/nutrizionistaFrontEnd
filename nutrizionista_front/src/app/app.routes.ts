import { Routes } from '@angular/router';
import { HomeComponent } from './screens/home/home';
import { ClienteComponent } from './components/clienti/clienti';
import { Login } from './screens/login/login';
import { ClienteDettaglioComponent } from './components/cliente-dettaglio/cliente-dettaglio';
import { UserProfileComponent } from './components/user-profile/user-profile';
import { RegisterScreen } from './screens/register-screen/register-screen';

//usiamo il data routing, soluzione che mi hanno consigliato


export const routes: Routes = [
  { path: '', component: Login },

  {
    path: 'login',
    loadComponent: () => import('./screens/login/login').then(m => m.Login),
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

  {
    path: 'clienti/:id',
    component: ClienteDettaglioComponent
  },

  {
    path: 'profilo',
    component: UserProfileComponent
  },
  {
    path: 'register',
    component: RegisterScreen
  }
];
