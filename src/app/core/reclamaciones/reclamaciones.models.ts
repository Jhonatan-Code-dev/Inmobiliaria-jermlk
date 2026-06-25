export interface Reclamacion {
  id: number;
  codigo: string;
  empresa_id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  menor_edad: boolean;
  nombre_apoderado?: string;
  tipo_bien: 'PRODUCTO' | 'SERVICIO';
  monto_reclamado: number;
  descripcion_bien: string;
  tipo_reclamacion: 'RECLAMO' | 'QUEJA';
  detalle_reclamacion: string;
  pedido_consumidor: string;
  estado: 'PENDIENTE' | 'RESUELTO';
  respuesta_detalle?: string;
  respondido_en?: string;
  creado_en: string;
}

export interface ReclamacionPayload {
  empresa_id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  menor_edad: boolean;
  nombre_apoderado?: string;
  tipo_bien: 'PRODUCTO' | 'SERVICIO';
  monto_reclamado: number;
  descripcion_bien: string;
  tipo_reclamacion: 'RECLAMO' | 'QUEJA';
  detalle_reclamacion: string;
  pedido_consumidor: string;
}

export interface ReclamacionListResponse {
  datos: Reclamacion[];
  paginacion: {
    total: number;
    paginas: number;
    pagina: number;
    paginaActual: number;
    porPagina: number;
  };
}

export interface EmpresaPublica {
  id: number;
  nombre: string;
}
