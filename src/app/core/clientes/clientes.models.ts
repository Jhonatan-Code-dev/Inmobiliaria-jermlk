export interface Cliente {
  id: number;
  empresa_id: number;
  tipo_identificacion_id: number;
  documento_numero: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  direccion: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  notas: string;
  estado: 'activo' | 'inactivo';
  creado_en: string;
}

export interface TipoIdentificacion {
  id: number;
  codigo: string;
  nombre: string;
  pais: string | null;
  activo: boolean;
}

export interface ClientesPaginacion {
  total: number;
  paginas: number;
  pagina: number;
  por_pagina: number;
}

export interface ClientesListResponse {
  datos: Cliente[];
  paginacion: ClientesPaginacion;
}

export interface ClientesFilters {
  empresa_id: number;
  pag?: number;
  buscar?: string;
}

export interface ClientePayload {
  empresa_id: number;
  tipo_identificacion_id: number;
  documento_numero: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fecha_nacimiento: string;
  nacionalidad: string;
  direccion: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  notas: string;
  estado: string;
}
