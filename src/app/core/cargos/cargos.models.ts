export interface Cargo {
  id: number;
  contrato_id?: number;
  concepto: string;
  monto: number;
  fecha_vencimiento?: string;
  estado: 'pendiente' | 'pagado' | 'anulado';
}

export interface CargosListResponse {
  datos: Cargo[];
  paginacion: {
    total: number;
    paginas: number;
    pagina_actual: number;
    por_pagina: number;
  };
}

export interface CargoPayload {
  contrato_id: number;
  monto: number;
  concepto: string;
  fecha_vencimiento: string;
}

export interface CargosFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
