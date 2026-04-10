export const APP_ROUTE_SEGMENTS = {
  root: '',
  login: 'login',
  menu: 'menu',
  overview: 'overview',
  gastos: 'gastos',
  clientes: 'clientes',
  inmuebles: 'inmuebles',
  alquileres: 'alquileres'
} as const;

export const APP_ROUTE_PATHS = {
  root: '/',
  login: `/${APP_ROUTE_SEGMENTS.login}`,
  menu: `/${APP_ROUTE_SEGMENTS.menu}`,
  menuOverview: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.overview}`,
  menuGastos: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.gastos}`,
  menuClientes: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.clientes}`,
  menuInmuebles: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.inmuebles}`,
  menuAlquileres: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.alquileres}`
} as const;
