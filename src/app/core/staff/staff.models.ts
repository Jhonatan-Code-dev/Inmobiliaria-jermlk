export interface StaffMember {
  id: number;
  usuario: string;
  rol: string;
  rol_id?: number;
  estado: 'activo' | 'inactivo';
}

export interface StaffListResponse {
  datos: StaffMember[];
  paginacion: {
    total: number;
    paginas: number;
    pagina_actual: number;
    por_pagina: number;
  };
}

export interface StaffPayload {
  usuario: string;
  password?: string;
  rol_id: number;
  estado?: 'activo' | 'inactivo';
}

export interface StaffFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
