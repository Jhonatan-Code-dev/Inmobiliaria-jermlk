export interface Medicion {
  id: number;
  tipo_servicio: 'agua' | 'luz' | 'otros';
  lectura_actual: number;
  lectura_anterior?: number;
  consumo: number;
  monto: number;
  fecha?: string;
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
  contrato_id: number;
  tipo_servicio: string;
  lectura_actual: number;
  precio_unitario: number;
}

export interface MedicionesFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
