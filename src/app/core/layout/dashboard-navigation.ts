import { APP_ROUTE_SEGMENTS } from '../routing/app-routes.constants';

export type DashboardSectionId = 'overview' | 'expenses' | 'clients' | 'inmuebles' | 'alquileres' | 'staff' | 'cargos' | 'pagos' | 'servicios' | 'tickets';

export type DashboardNavItem = {
  readonly id: DashboardSectionId;
  readonly path: string;
  readonly label: string;
  readonly icon: string;
};

export const DASHBOARD_NAVIGATION_ITEMS: readonly DashboardNavItem[] = [
  {
    id: 'overview',
    path: APP_ROUTE_SEGMENTS.overview,
    label: 'Resumen',
    icon: 'M3 11.5 12 4l9 7.5M5 10.8V20h14v-9.2M9 20v-5h6v5'
  },
  {
    id: 'inmuebles',
    path: APP_ROUTE_SEGMENTS.inmuebles,
    label: 'Inmuebles',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  },
  {
    id: 'alquileres',
    path: APP_ROUTE_SEGMENTS.alquileres,
    label: 'Contratos',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    id: 'pagos',
    path: APP_ROUTE_SEGMENTS.pagos,
    label: 'Cobros',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'cargos',
    path: APP_ROUTE_SEGMENTS.cargos,
    label: 'Deudas/Cargos',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  },
  {
    id: 'servicios',
    path: APP_ROUTE_SEGMENTS.servicios,
    label: 'Mediciones',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  {
    id: 'expenses',
    path: APP_ROUTE_SEGMENTS.gastos,
    label: 'Egresos',
    icon: 'M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'clients',
    path: APP_ROUTE_SEGMENTS.clientes,
    label: 'Clientes',
    icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  },
  {
    id: 'tickets',
    path: APP_ROUTE_SEGMENTS.tickets,
    label: 'Mantenimiento',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
  },
  {
    id: 'staff',
    path: APP_ROUTE_SEGMENTS.staff,
    label: 'Config Staff',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  }
] as const;

