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
      },
      {
        path: APP_ROUTE_SEGMENTS.clientes,
        loadComponent: () => import('./pages/clientes-page.component').then(m => m.ClientesPageComponent),
        title: 'Inmobiliaria | Clientes'
      },
      {
        path: APP_ROUTE_SEGMENTS.inmuebles,
        loadComponent: () => import('./pages/inmuebles-page.component').then(m => m.InmueblesPageComponent),
        title: 'Inmobiliaria | Inmuebles'
      },
      {
        path: APP_ROUTE_SEGMENTS.alquileres,
        loadComponent: () => import('./pages/alquileres-page.component').then(m => m.AlquileresPageComponent),
        title: 'Inmobiliaria | Alquileres'
      },
      {
        path: APP_ROUTE_SEGMENTS.staff,
        loadComponent: () => import('./pages/staff-page.component').then(m => m.StaffPageComponent),
        title: 'Inmobiliaria | Staff'
      },
      {
        path: APP_ROUTE_SEGMENTS.cargos,
        loadComponent: () => import('./pages/cargos-page.component').then(m => m.CargosPageComponent),
        title: 'Inmobiliaria | Cargos'
      },
      {
        path: APP_ROUTE_SEGMENTS.pagos,
        loadComponent: () => import('./pages/pagos-page.component').then(m => m.PagosPageComponent),
        title: 'Inmobiliaria | Pagos'
      },
      {
        path: APP_ROUTE_SEGMENTS.servicios,
        loadComponent: () => import('./pages/servicios-page.component').then(m => m.ServiciosPageComponent),
        title: 'Inmobiliaria | Servicios'
      },
      {
        path: APP_ROUTE_SEGMENTS.tickets,
        loadComponent: () => import('./pages/tickets-page.component').then(m => m.TicketsPageComponent),
        title: 'Inmobiliaria | Mantenimiento'
      },
      {
        path: APP_ROUTE_SEGMENTS.asistencia,
        loadComponent: () => import('./pages/asistencia-main-page.component').then(m => m.AsistenciaPageComponent),
        title: 'Inmobiliaria | Asistencia'
      },
      {
        path: APP_ROUTE_SEGMENTS.supervision_asistencia,
        loadComponent: () => import('./pages/asistencia-supervision-page.component').then(m => m.AsistenciaSupervisionPageComponent),
        title: 'Inmobiliaria | Supervisión Asistencia'
      },
      {
        path: APP_ROUTE_SEGMENTS.cola_trabajo,
        loadComponent: () => import('./pages/cola-trabajo-page.component').then(m => m.ColaTrabajoPageComponent),
        title: 'Inmobiliaria | Cola de Trabajo'
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
