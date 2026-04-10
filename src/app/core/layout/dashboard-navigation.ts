import { APP_ROUTE_SEGMENTS } from '../routing/app-routes.constants';

export type DashboardSectionId = 'overview' | 'expenses' | 'clients' | 'inmuebles';

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
    id: 'expenses',
    path: APP_ROUTE_SEGMENTS.gastos,
    label: 'Gastos',
    icon: 'M4 7h16M7 3v4M17 3v4M6 11h12M6 15h8M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2'
  },
  {
    id: 'clients',
    path: APP_ROUTE_SEGMENTS.clientes,
    label: 'Clientes',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M19 8a4 4 0 0 1 0 7.75'
  }
] as const;
