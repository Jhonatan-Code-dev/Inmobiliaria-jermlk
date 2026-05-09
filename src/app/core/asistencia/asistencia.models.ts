export interface AsistenciaRegistro {
  id: number;
  empresa_id: number;
  usuario_id: number;
  usuario_nombre?: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  estado: 'puntual' | 'tarde' | 'falta' | 'permiso' | 'justificado';
  notas: string | null;
  horas_trabajadas: number | null;
}

export interface Permiso {
  id: number;
  usuario_id: number;
  fecha: string;
  motivo: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  respuesta: string | null;
}

export interface Horario {
  usuario_id: number;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  dias_laborables: string; // Ej: "1,2,3,4,5"
}

export interface AsistenciaFiltros {
  empresa_id?: number;
  usuario_id?: number;
  estado?: string;
  desde?: string;
  hasta?: string;
  pag?: number;
  limite?: number;
}

export type AsistenciaGlobalResponse = AsistenciaRegistro[];

export interface SolicitudPermisoPayload {
  fecha: string;
  motivo: string;
}

export interface HorarioPayload {
  usuario_id: number;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  dias_laborables: string;
}

export interface EvaluarPermisoPayload {
  estado: 'aprobado' | 'rechazado';
  respuesta: string;
}
