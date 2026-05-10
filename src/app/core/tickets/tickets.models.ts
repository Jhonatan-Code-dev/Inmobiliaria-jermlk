export type TicketEstado = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketPrioridad = 'baja' | 'media' | 'alta';

export interface Ticket {
  id: number;
  empresa_id: number;
  unidad_id: number;
  unidad_nombre?: string;
  cliente_id?: number | null;
  cliente_nombre?: string | null;
  asunto: string;
  descripcion: string;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  fecha_apertura: string;
}

export interface TicketsListResponse {
  datos: Ticket[];
  paginacion: {
    total: number;
    paginas: number;
    pagina_actual: number;
    por_pagina: number;
  };
}

export interface TicketsResumen {
  total: number;
  abiertos: number;
  en_progreso: number;
  resueltos: number;
  cerrados: number;
}

export interface TicketPayload {
  unidad_id: number;
  cliente_id?: number | null;
  asunto: string;
  descripcion: string;
  prioridad: TicketPrioridad;
  estado?: TicketEstado;
}

export interface TicketsConfig {
  inmuebles: { id: number; nombre: string }[];
  clientes: { id: number; nombre: string }[];
  prioridades: TicketPrioridad[];
  estados: TicketEstado[];
}

export interface TicketsFilters {
  pag?: number;
  por_pagina?: number;
  propiedad_id?: number;
  unidad_id?: number;
  estado?: TicketEstado;
  buscar?: string;
}
