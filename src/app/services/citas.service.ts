import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { 
  Cita, 
  CitaPayload, 
  CitaEstado, 
  CitasConfig, 
  CitasFilters, 
  CitasListResponse
} from '../core/citas/citas.models';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: CitasFilters): Observable<CitasListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<CitasListResponse>(this.apiUrlBuilder.build('/user/citas'), { params });
  }

  getConfigFormulario(): Observable<CitasConfig> {
    return this.http.get<CitasConfig>(this.apiUrlBuilder.build('/user/citas/config-formulario'));
  }

  getUnidadesByInmueble(inmuebleId: number, empresaId: number): Observable<any[]> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<any[]>(this.apiUrlBuilder.build(`/user/inmuebles/${inmuebleId}/unidades`), { params });
  }

  getById(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.apiUrlBuilder.build('/user/citas')}/${id}`);
  }

  create(payload: CitaPayload): Observable<Cita> {
    return this.http.post<Cita>(this.apiUrlBuilder.build('/user/citas'), payload);
  }

  update(id: number, payload: Partial<CitaPayload>): Observable<Cita> {
    return this.http.put<Cita>(`${this.apiUrlBuilder.build('/user/citas')}/${id}`, payload);
  }

  cambiarEstado(id: number, estado: CitaEstado): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/citas')}/${id}/estado`, { estado });
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/citas')}/${id}`);
  }
}
