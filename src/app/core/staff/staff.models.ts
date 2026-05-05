export interface StaffRole {
  ID: number;
  Nombre: string;
  Descripcion: string;
}

export interface StaffMember {
  id: number;
  usuario_id: number;
  usuario: string;
  rol_id: number;
  rol_nombre: string;
  principal: boolean;
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
  usuario?: string;
  contrasena?: string;
  rol_id?: number;
  estado?: 'activo' | 'inactivo';
}

export interface StaffFilters {
  pag?: number;
  por_pagina?: number;
  buscar?: string;
}
