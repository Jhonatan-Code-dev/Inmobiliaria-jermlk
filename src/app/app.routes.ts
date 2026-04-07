import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SessionStore } from './core/auth/session.store';
import { DashboardPageComponent } from './pages/dashboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';

const redirectAuthenticatedUser: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  return sessionStore.isAuthenticated() ? router.createUrlTree(['/menu']) : true;
};

const requireAuthenticatedUser: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  return sessionStore.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    canActivate: [redirectAuthenticatedUser],
    component: LoginPageComponent,
    title: 'Inmobiliaria | Acceso al Sistema'
  },
  {
    path: 'menu',
    canActivate: [requireAuthenticatedUser],
    component: DashboardPageComponent,
    title: 'Inmobiliaria | Menu Principal'
  },
  {
    path: 'panel',
    pathMatch: 'full',
    redirectTo: 'menu'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
