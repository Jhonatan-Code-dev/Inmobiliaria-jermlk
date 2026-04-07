import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginPageComponent,
    title: 'Inmobiliaria | Acceso al Sistema'
  },
  {
    path: 'login',
    redirectTo: ''
  },
  {
    path: '**',
    redirectTo: ''
  }
];
