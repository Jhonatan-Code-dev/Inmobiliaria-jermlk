import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page.component';
import { LoginPageComponent } from './pages/login-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'AlquilaMax | Gestion de alquileres y pagos'
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'AlquilaMax | Acceso al sistema'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
