export interface Medicion {
  id: number;
  tipo_servicio: 'agua' | 'luz' | 'otros';
  lectura_actual: number;
  lectura_anterior?: number;
  consumo: number;
  monto: number;
  fecha?: string;
  contrato_id?: number;
  cargo_id?: number;
}

export interface MedicionesListResponse {
  datos: Medicion[];
  paginacion: {
    total: number;
    paginas: number;
    pagina_actual: number;
    por_pagina: number;
  };
}

export interface MedicionPayload {
  contrato_id: number | string;
  tipo_servicio: 'luz' | 'agua';
  lectura_actual: number;
  lectura_anterior?: number;
  precio_unitario: number;
  fecha_lectura: string;
  factor?: number;
  cargo_fijo?: number;
}

export interface AlquilerSelector {
  id: number;
  cliente_nombre: string;
  unidad_codigo: string;
  cliente?: string;
  unidad?: string;
}

export interface MedicionesFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
