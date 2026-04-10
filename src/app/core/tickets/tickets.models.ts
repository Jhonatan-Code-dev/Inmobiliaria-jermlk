export interface Ticket {
  id: number;
  unidad_id: number;
  asunto: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'abierto' | 'en_proceso' | 'cerrado';
  creado_en?: string;
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

export interface TicketPayload {
  unidad_id: number;
  asunto: string;
  descripcion: string;
  prioridad: string;
  estado?: string;
}

export interface TicketsFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
