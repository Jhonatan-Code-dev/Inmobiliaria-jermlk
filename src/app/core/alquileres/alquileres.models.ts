export interface Alquiler {
  id: number;
  cliente_id: number;
  cliente: string;
  unidad_id: number;
  unidad: string;
  monto: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  moneda: string;
}

export interface AlquileresPaginacion {
  total: number;
  paginas: number;
  pagina: number;
  pagina_actual: number;
  por_pagina: number;
}

export interface AlquileresListResponse {
  datos: Alquiler[];
  paginacion: AlquileresPaginacion;
}

export interface AlquilerPayload {
  cliente_id: number;
  unidad_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  vencimiento_dia_pago: number;
  monto_renta: number;
  deposito_garantia: number;
  moneda: string;
}

export interface AlquileresFilters {
  empresa_id: number;
  pag?: number;
  por_pagina?: number;
  buscar?: string;
  estado?: string;
  unidad_id?: number;
}

export interface PagoPayload {
  alquiler_id: number;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  nota: string;
  mes_correspondiente: number;
}

export interface PagoResponse {
  id: number;
  alquiler_id: number;
  numero_recibo: string;
  fecha_pago: string;
  moneda: string;
  monto_pagado: number;
  metodo_pago: string;
  nota: string;
  mes_correspondiente: number;
}

export interface PagoPendiente {
  alquiler_id: number;
  cliente: string;
  unidad: string;
  monto: number;
  fecha_vencimiento: string;
  estado: string;
}

export interface Plantilla {
  id: number;
  empresa_id: number;
  nombre: string;
  contenido: string;
  creado_en: string;
}

export interface GenerarDocumentoResponse {
  alquiler_id?: number;
  contenido: string;
}

export interface GeneradorBorradorPayload {
  plantilla_id: number;
  cliente_documento: string;
  cliente_nombre: string;
  cliente_apellidos: string;
  cliente_direccion: string;
  cliente_correo: string;
  unidad_codigo: string;
  monto_renta: number;
  monto_deposito: number;
  moneda: string;
  fecha_inicio: string;
  fecha_fin: string;
  dia_vencimiento: number;
  observaciones: string;
}
