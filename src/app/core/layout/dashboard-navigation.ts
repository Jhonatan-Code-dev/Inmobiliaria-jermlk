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
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    id: 'alquileres',
    path: APP_ROUTE_SEGMENTS.alquileres,
    label: 'Contratos',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
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
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
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
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M19 8a4 4 0 0 1 0 7.75'
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

