export type CitaEstado = 'programada' | 'realizada' | 'cancelada' | 'no_asistio';

export interface Cita {
  id: number;
  empresa_id: number;
  propiedad_id?: number | null;
  propiedad_nombre?: string;
  unidad_id?: number | null;
  unidad_nombre?: string;
  cliente_id?: number | null;
  cliente_nombre?: string;
  nombre_prospecto: string;
  telefono_prospecto: string;
  correo_prospecto?: string | null;
  fecha_visita: string; // ISO String
  estado: CitaEstado;
  comentarios?: string | null;
  creado_en: string;
}

export interface CitaPayload {
  propiedad_id?: number | null;
  unidad_id?: number | null;
  cliente_id?: number | null;
  nombre_prospecto: string;
  telefono_prospecto: string;
  correo_prospecto?: string | null;
  fecha_visita: string; // ISO String
  estado?: CitaEstado;
  comentarios?: string | null;
}

export interface CitasConfig {
  inmuebles: { id: number; nombre: string }[];
  clientes: { id: number; nombre: string }[];
  estados: CitaEstado[];
}

export interface CitasFilters {
  pag?: number;
  por_pagina?: number;
  propiedad_id?: number | null;
  unidad_id?: number | null;
  estado?: CitaEstado | '';
  buscar?: string;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

export interface CitasListResponse {
  datos: Cita[];
  total: number;
}
