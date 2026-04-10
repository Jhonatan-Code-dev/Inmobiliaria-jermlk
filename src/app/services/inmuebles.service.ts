import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  Inmueble,
  InmueblePayload,
  InmueblesFilters,
  InmueblesListResponse,
  Unidad,
  UnidadPayload
} from '../core/inmuebles/inmuebles.models';

@Injectable({
  providedIn: 'root'
})
export class InmueblesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: InmueblesFilters): Observable<InmueblesListResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }

    return this.http.get<InmueblesListResponse>(this.apiUrlBuilder.build('/user/inmuebles'), { params });
  }

  getById(id: number, empresaId: number): Observable<Inmueble> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Inmueble>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`, { params });
  }

  create(payload: InmueblePayload): Observable<Inmueble> {
    return this.http.post<Inmueble>(this.apiUrlBuilder.build('/user/inmuebles'), payload);
  }

  update(id: number, payload: InmueblePayload): Observable<Inmueble> {
    return this.http.put<Inmueble>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`, payload);
  }

  delete(id: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`,
      { params }
    );
  }

  // Unidades CRUD
  listUnidades(inmuebleId: number, empresaId: number): Observable<Unidad[]> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Unidad[]>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades`, { params });
  }

  createUnidad(inmuebleId: number, payload: UnidadPayload): Observable<Unidad> {
    return this.http.post<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades`, payload);
  }

  getUnidadById(inmuebleId: number, unidadId: number, empresaId: number): Observable<Unidad> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`, { params });
  }

  updateUnidad(inmuebleId: number, unidadId: number, payload: UnidadPayload): Observable<Unidad> {
    return this.http.put<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`, payload);
  }

  deleteUnidad(inmuebleId: number, unidadId: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`,
      { params }
    );
  }
}
