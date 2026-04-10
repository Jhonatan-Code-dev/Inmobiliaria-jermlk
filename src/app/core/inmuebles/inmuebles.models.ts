export interface Inmueble {
  id: number;
  empresa_id: number;
  nombre: string;
  tipo: 'casa' | 'edificio' | 'quinta' | 'condominio' | 'otro';
  descripcion: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  codigo_postal: string;
  total_pisos: number;
  total_unidades: number;
  estado: 'activa' | 'mantenimiento' | 'inactiva';
  creado_en: string;
  unidades?: Unidad[];
}

export interface Unidad {
  id: number;
  propiedad_id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  numero_piso: number;
  dormitorios: number;
  banos: number;
  area_m2: number;
  capacidad: number;
  moneda: string;
  precio_base: number;
  deposito_requerido: number;
  incluye_agua: boolean;
  incluye_luz: boolean;
  incluye_internet: boolean;
  notas: string;
  estado: 'disponible' | 'reservado' | 'ocupado' | 'mantenimiento';
  creado_en: string;
}

export interface InmueblesPaginacion {
  total: number;
  paginas: number;
  pagina: number;
  por_pagina: number;
}

export interface InmueblesListResponse {
  datos: Inmueble[];
  paginacion: InmueblesPaginacion;
}

export interface InmueblesFilters {
  empresa_id: number;
  pag?: number;
  buscar?: string;
  estado?: string;
  tipo?: string;
}

export interface InmueblePayload {
  empresa_id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  direccion: string;
  ciudad: string;
  region: string;
  pais: string;
  codigo_postal: string;
  total_pisos: number;
  total_unidades: number;
  estado: string;
}

export interface UnidadPayload {
  codigo: string;
  nombre: string;
  tipo: string;
  numero_piso: number;
  dormitorios: number;
  banos: number;
  area_m2: number;
  capacidad: number;
  moneda: string;
  precio_base: number;
  deposito_requerido: number;
  incluye_agua: boolean;
  incluye_luz: boolean;
  incluye_internet: boolean;
  notas: string;
  estado: string;
}
