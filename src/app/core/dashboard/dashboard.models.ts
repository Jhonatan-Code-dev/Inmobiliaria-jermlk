export interface DashboardResumen {
  total_propiedades: number;
  total_unidades: number;
  unidades_ocupadas: number;
  unidades_libres: number;
  tasa_ocupacion_pct: number;
  contratos_activos: number;
  contratos_borrador: number;
  contratos_vencidos: number;
  ingresos_mes_actual: number;
  gastos_mes_actual: number;
  balance_neto_mes: number;
  total_morosos: number;
  monto_pendiente_cobro: number;
  tickets_abiertos: number;
  tickets_en_progreso: number;
  total_clientes: number;
  mes: number;
  anio: number;
}

export interface OcupacionPropiedad {
  propiedad_id: number;
  nombre: string;
  direccion: string;
  total_unidades: number;
  ocupadas: number;
  libres: number;
  tasa_ocupacion_pct: number;
}

export interface DashboardOcupacion {
  total_unidades: number;
  total_ocupadas: number;
  total_libres: number;
  tasa_global_pct: number;
  por_propiedad: OcupacionPropiedad[];
}

export interface DashboardMoroso {
  cliente_id: number;
  nombre_completo: string;
  unidad_codigo: string;
  propiedad_nombre: string;
  contrato_id: number;
  monto_pendiente: number;
  dias_vencido: number;
  fecha_vencimiento: string;
}

export interface DashboardMorosidad {
  total_morosos: number;
  monto_total_pendiente: number;
  morosos: DashboardMoroso[];
}

export interface SerieMensual {
  periodo: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

export interface DashboardFinanciero {
  desde: string;
  hasta: string;
  total_ingresos: number;
  total_gastos: number;
  balance_neto: number;
  serie_mensual: SerieMensual[];
}

export interface DashboardContratoVencer {
  contrato_id: number;
  codigo: string;
  cliente_nombre: string;
  unidad_codigo: string;
  propiedad_nombre: string;
  fecha_fin: string;
  dias_restantes: number;
  monto_renta: number;
}

export interface CargoEstadoCuenta {
  cargo_id: number;
  concepto: string;
  monto: number;
  saldo: number;
  estado: string;
  fecha_vencimiento: string;
}

export interface DashboardEstadoCuenta {
  cliente_id: number;
  nombre_completo: string;
  documento: string;
  correo: string | null;
  total_cargado: number;
  total_pagado: number;
  saldo_pendiente: number;
  cargos: CargoEstadoCuenta[];
}

export interface DashboardTopUnidad {
  unidad_id: number;
  codigo: string;
  propiedad_nombre: string;
  total_ingresos: number;
  total_pagos: number;
}
