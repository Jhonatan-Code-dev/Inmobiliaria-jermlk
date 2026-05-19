export const APP_ROUTE_SEGMENTS = {
  root: '',
  login: 'login',
  menu: 'menu',
  overview: 'overview',
  gastos: 'gastos',
  clientes: 'clientes',
  inmuebles: 'inmuebles',
  alquileres: 'alquileres',
  staff: 'staff',
  cargos: 'cargos',
  pagos: 'pagos',
  servicios: 'servicios',
  tickets: 'tickets',
  asistencia: 'asistencia',
  supervision_asistencia: 'supervision-asistencia',
  cola_trabajo: 'cola-trabajo',
  reportes: 'reportes'
} as const;

export const APP_ROUTE_PATHS = {
  root: '/',
  login: `/${APP_ROUTE_SEGMENTS.login}`,
  menu: `/${APP_ROUTE_SEGMENTS.menu}`,
  menuOverview: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.overview}`,
  menuGastos: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.gastos}`,
  menuClientes: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.clientes}`,
  menuInmuebles: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.inmuebles}`,
  menuAlquileres: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.alquileres}`,
  menuStaff: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.staff}`,
  menuCargos: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.cargos}`,
  menuPagos: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.pagos}`,
  menuServicios: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.servicios}`,
  menuTickets: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.tickets}`,
  menuAsistencia: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.asistencia}`,
  menuSupervisionAsistencia: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.supervision_asistencia}`,
  menuColaTrabajo: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.cola_trabajo}`,
  menuReportes: `/${APP_ROUTE_SEGMENTS.menu}/${APP_ROUTE_SEGMENTS.reportes}`
} as const;
