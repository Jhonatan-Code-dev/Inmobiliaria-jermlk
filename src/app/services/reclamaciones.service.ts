import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  EmpresaPublica,
  Reclamacion,
  ReclamacionPayload,
  ReclamacionListResponse
} from '../core/reclamaciones/reclamaciones.models';

@Injectable({
  providedIn: 'root'
})
export class ReclamacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  // Public methods
  getPublicEmpresas(): Observable<EmpresaPublica[]> {
    return this.http.get<EmpresaPublica[]>(this.apiUrlBuilder.build('/public/empresas'));
  }

  registrarPublica(payload: ReclamacionPayload): Observable<Reclamacion> {
    return this.http.post<Reclamacion>(this.apiUrlBuilder.build('/public/reclamaciones'), payload);
  }

  descargarPdfPublico(id: number, empresaId: number): Observable<Blob> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get(
      `${this.apiUrlBuilder.build('/public/reclamaciones')}/${id}/pdf`,
      { params, responseType: 'blob' }
    );
  }

  // Private Admin methods
  list(pag: number, empresaId: number): Observable<ReclamacionListResponse> {
    const params = new HttpParams()
      .set('empresa_id', String(empresaId))
      .set('pag', String(pag));
    return this.http.get<ReclamacionListResponse>(
      this.apiUrlBuilder.build('/user/reclamaciones'),
      { params }
    );
  }

  getById(id: number, empresaId: number): Observable<Reclamacion> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Reclamacion>(
      `${this.apiUrlBuilder.build('/user/reclamaciones')}/${id}`,
      { params }
    );
  }

  responder(id: number, respuesta: string): Observable<Reclamacion> {
    return this.http.put<Reclamacion>(
      `${this.apiUrlBuilder.build('/user/reclamaciones')}/${id}/respuesta`,
      { respuesta }
    );
  }

  delete(id: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrlBuilder.build('/user/reclamaciones')}/${id}`,
      { params }
    );
  }
}
