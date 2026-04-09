export interface User {
  id: number;
  usuario: string;
  empresa_id: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  pais?: string;
  moneda: string;
  maximo_usuarios?: number;
  estado?: boolean;
  vencimiento?: string;
  creado_en?: string;
}

export interface LoginPayload {
  usuario: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  empresa_id: number;
  user: User;
  empresa: Empresa;
}

export interface MeResponse {
  token: string;
  empresa_id: number;
  user: User;
  empresa: Empresa;
}

export interface ApiMessageResponse {
  message: string;
}
