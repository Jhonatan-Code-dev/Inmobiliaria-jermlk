export interface Inmueble {
  id: number;
  empresa_id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  direccion: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  codigo_postal?: string;
  total_pisos: number;
  total_unidades: number;
  estado: string;
  creado_en: string;
  unidades?: Unidad[];
}

export interface Unidad {
  id: number;
  codigo: string;
  piso: number;
  estado: string;
  nombre?: string;
  tipo?: string;
  precio_base?: number;
  moneda?: string;
  area_m2?: number;
}

export interface InmueblesPaginacion {
  total: number;
  paginas: number;
  pagina_actual: number;
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
  descripcion?: string;
  direccion: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  codigo_postal?: string;
  total_pisos: number;
  total_unidades: number;
  estado: string;
}

export interface UnidadPayload {
  empresa_id: number;
  codigo: string;
  nombre?: string;
  piso: number;
  precio_base?: number;
  moneda?: string;
  area_m2?: number;
  estado: string;
}
