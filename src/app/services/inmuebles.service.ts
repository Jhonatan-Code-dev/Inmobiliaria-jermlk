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
    let params = new HttpParams().set('empresa_id', String(filters.empresa_id));
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.buscar) params = params.set('buscar', filters.buscar);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.tipo) params = params.set('tipo', filters.tipo);

    return this.http.get<InmueblesListResponse>(this.apiUrlBuilder.build('/user/inmuebles'), { params });
  }

  getById(id: number, empresaId: number): Observable<Inmueble> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Inmueble>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`, { params });
  }

  create(payload: InmueblePayload): Observable<Inmueble> {
    return this.http.post<Inmueble>(this.apiUrlBuilder.build('/user/inmuebles'), payload);
  }

  update(id: number, payload: InmueblePayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`, payload);
  }

  delete(id: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${id}`, { params });
  }

  // Unidades CRUD

  listUnidades(inmuebleId: number): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades`);
  }

  createUnidad(inmuebleId: number, payload: any): Observable<Unidad> {
    return this.http.post<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades`, payload);
  }

  getUnidadById(inmuebleId: number, unidadId: number): Observable<Unidad> {
    return this.http.get<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`);
  }

  updateUnidad(inmuebleId: number, unidadId: number, payload: any): Observable<Unidad> {
    return this.http.put<Unidad>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`, payload);
  }

  deleteUnidad(inmuebleId: number, unidadId: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/inmuebles')}/${inmuebleId}/unidades/${unidadId}`);
  }
}
