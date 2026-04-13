export interface Pago {
  id: number;
  alquiler_id: number;
  numero_recibo: string;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  mes_correspondiente: number;
  nota?: string;
  cliente?: string;
  unidad?: string;
  moneda?: string;
}

export interface PagosListResponse {
  datos: Pago[];
  paginacion: {
    total: number;
    paginas: number;
    pagina_actual: number;
    por_pagina: number;
  };
}

export interface PagoPayload {
  alquiler_id: number;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  mes_correspondiente: number;
  nota?: string;
}

export interface PagosFilters {
  empresa_id?: number;
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}

export interface PagoPendiente {
  alquiler_id: number;
  cliente: string;
  monto: number;
  fecha_vencimiento: string;
}
