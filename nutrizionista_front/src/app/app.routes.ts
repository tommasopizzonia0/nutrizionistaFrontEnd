import { Routes } from '@angular/router';


// Screens
import { Login } from './screens/login/login';
import { RegisterScreen } from './screens/register-screen/register-screen';

// Pages / Components
import { HomeComponent } from './screens/home/home';
import { ClienteComponent } from './components/clienti/clienti';
import { ClienteDettaglioComponent } from './components/cliente-dettaglio/cliente-dettaglio';
import { UserProfileComponent } from './components/user-profile/user-profile';

import { MainLayoutComponent } from './components/layouts/main-layout/main-layout.component/main-layout.component';
import { MisurazioneComponent } from './components/misurazione/misurazione';
import { SchedaDietaComponent } from './components/scheda-dieta/scheda-dieta';

export const routes: Routes = [

  /* =======================
     AUTH (NO NAVBAR)
  ======================== */
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: RegisterScreen
  },

  /* =======================
     APP (WITH NAVBAR)
  ======================== */
  {
    path: '',
    component: MainLayoutComponent,
    children: [
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
        path: 'misurazione/:clienteId',
        component: MisurazioneComponent
      },
      {
        path: 'scheda-dieta/:clienteId',
        component: SchedaDietaComponent
      },
      {
        path: 'profilo',
        component: UserProfileComponent
      }
    ]
  },

  /* =======================
     FALLBACK
  ======================== */
  {
    path: '**',
    redirectTo: 'login'
  }
];
