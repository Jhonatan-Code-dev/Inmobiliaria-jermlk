import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  AsistenciaFiltros,
  AsistenciaRegistro,
  AsistenciaReporteResponse,
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

  getAsistenciaReporte(filters: AsistenciaFiltros): Observable<AsistenciaReporteResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<AsistenciaReporteResponse>(this.apiUrlBuilder.build('/user/asistencia/reporte'), {
      params
    });
  }

  deleteRegistro(empresaId: number, registroId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      this.apiUrlBuilder.build(`/user/asistencia/registros/${registroId}?empresa_id=${empresaId}`)
    );
  }
}
