export const APP_ROUTE_SEGMENTS = {
  root: '',
  login: 'login',
  menu: 'menu',
  overview: 'overview',
  gastos: 'gastos'
} as const;

export const APP_ROUTE_PATHS = {
  root: '/',
  login: `/${APP_ROUTE_SEGMENTS.login}`,
  menu: `/${APP_ROUTE_SEGMENTS.menu}`,
  menuOverview: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.overview}`,
  menuGastos: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.gastos}`
} as const;
