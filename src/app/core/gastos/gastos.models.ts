export interface Gasto {
  id: number;
  empresa_id: number;
  monto: number;
  fecha: string;
  tipo_pago_id: number;
  descripcion: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
}

export interface GastosPaginacion {
  total: number;
  paginas: number;
  pagina: number;
  por_pagina: number;
}

export interface GastosListResponse {
  datos: Gasto[];
  paginacion: GastosPaginacion;
}

export interface GastosFilters {
  empresa_id: number;
  pag?: number;
  anio?: number | null;
  mes?: number | null;
  desde?: string | null;
  hasta?: string | null;
  fecha?: string | null;
}

export interface GastoPayload {
  monto: number;
  fecha: string;
  tipo_pago_id: number;
  descripcion: string;
  empresa_id: number;
}
