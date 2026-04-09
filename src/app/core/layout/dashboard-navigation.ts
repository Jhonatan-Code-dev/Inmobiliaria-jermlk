import { APP_ROUTE_SEGMENTS } from '../routing/app-routes.constants';

export type DashboardSectionId = 'overview' | 'expenses';

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
    id: 'expenses',
    path: APP_ROUTE_SEGMENTS.gastos,
    label: 'Gastos',
    icon: 'M4 7h16M7 3v4M17 3v4M6 11h12M6 15h8M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2'
  }
] as const;
