import { Routes } from '@angular/router';
import { APP_ROUTE_SEGMENTS } from './core/routing/app-routes.constants';
import {
  redirectAuthenticatedUserGuard,
  requireAuthenticatedUserGuard
} from './core/routing/auth.guards';

export const routes: Routes = [
  {
    path: APP_ROUTE_SEGMENTS.root,
    canActivate: [redirectAuthenticatedUserGuard],
    loadComponent: () => import('./pages/login-page.component').then(m => m.LoginPageComponent),
    title: 'Inmobiliaria | Acceso al Sistema'
  },
  {
    path: APP_ROUTE_SEGMENTS.login,
    pathMatch: 'full',
    redirectTo: APP_ROUTE_SEGMENTS.root
  },
  {
    path: APP_ROUTE_SEGMENTS.menu,
    canActivate: [requireAuthenticatedUserGuard],
    loadComponent: () => import('./pages/dashboard-page.component').then(m => m.DashboardPageComponent),
    children: [
      {
        path: APP_ROUTE_SEGMENTS.root,
        pathMatch: 'full',
        redirectTo: APP_ROUTE_SEGMENTS.overview
      },
      {
        path: APP_ROUTE_SEGMENTS.overview,
        loadComponent: () => import('./pages/overview-page.component').then(m => m.OverviewPageComponent),
        title: 'Inmobiliaria | Resumen'
      },
      {
        path: APP_ROUTE_SEGMENTS.gastos,
        loadComponent: () => import('./pages/gastos-page.component').then(m => m.GastosPageComponent),
        title: 'Inmobiliaria | Egresos'
      }
    ]
  },
  {
    path: 'panel',
    pathMatch: 'full',
    redirectTo: `${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.overview}`
  },
  {
    path: '**',
    redirectTo: APP_ROUTE_SEGMENTS.root
  }
];
