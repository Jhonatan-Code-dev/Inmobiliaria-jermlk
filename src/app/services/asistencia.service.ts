import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  AsistenciaFiltros,
  AsistenciaGlobalResponse,
  AsistenciaRegistro,
  EvaluarPermisoPayload,
  HorarioPayload,
  Permiso,
  SolicitudPermisoPayload
} from '../core/asistencia/asistencia.models';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  // --- Operaciones del Empleado ---

  marcarAsistencia(): Observable<AsistenciaRegistro> {
    return this.http.post<AsistenciaRegistro>(this.apiUrlBuilder.build('/user/asistencia/marcar'), {});
  }

  getMiHistorial(): Observable<AsistenciaRegistro[]> {
    return this.http.get<AsistenciaRegistro[]>(this.apiUrlBuilder.build('/user/asistencia/mi-historial'));
  }

  solicitarPermiso(payload: SolicitudPermisoPayload): Observable<Permiso> {
    return this.http.post<Permiso>(this.apiUrlBuilder.build('/user/asistencia/permisos'), payload);
  }

  // --- Operaciones del Administrador ---

  getRegistrosGlobales(filters: AsistenciaFiltros): Observable<AsistenciaGlobalResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<AsistenciaGlobalResponse>(this.apiUrlBuilder.build('/user/asistencia/registros'), {
      params
    });
  }

  asignarHorario(empresaId: number, payload: HorarioPayload): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      this.apiUrlBuilder.build(`/user/asistencia/horarios?empresa_id=${empresaId}`),
      payload
    );
  }

  evaluarPermiso(empresaId: number, permisoId: number, payload: EvaluarPermisoPayload): Observable<Permiso> {
    return this.http.put<Permiso>(
      this.apiUrlBuilder.build(`/user/asistencia/permisos/${permisoId}/estado?empresa_id=${empresaId}`),
      payload
    );
  }

  deleteRegistro(empresaId: number, registroId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      this.apiUrlBuilder.build(`/user/asistencia/registros/${registroId}?empresa_id=${empresaId}`)
    );
  }

  getHorarioDetalle(empresaId: number, usuarioId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrlBuilder.build(`/user/asistencia/horarios/detalle?empresa_id=${empresaId}&usuario_id=${usuarioId}`)
    );
  }

  getPermisos(empresaId: number, estado?: string): Observable<Permiso[]> {
    let url = `/user/asistencia/permisos?empresa_id=${empresaId}`;
    if (estado) url += `&estado=${estado}`;
    return this.http.get<Permiso[]>(this.apiUrlBuilder.build(url));
  }
}
