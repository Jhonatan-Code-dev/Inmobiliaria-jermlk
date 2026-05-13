import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { Medicion, MedicionPayload, MedicionesFilters, MedicionesListResponse } from '../core/servicios/servicios.models';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: MedicionesFilters): Observable<MedicionesListResponse> {
    let params = new HttpParams();
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.por_pagina) params = params.set('por_pagina', String(filters.por_pagina));
    if (filters.buscar) params = params.set('buscar', filters.buscar);

    return this.http.get<MedicionesListResponse>(this.apiUrlBuilder.build('/user/servicios'), { params });
  }

  getUltimaLectura(contratoId: number, tipo: 'luz' | 'agua' = 'luz'): Observable<Partial<Medicion>> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<Partial<Medicion>>(this.apiUrlBuilder.build(`/user/servicios/ultimo/${contratoId}`), { params });
  }

  registrarYCobrar(payload: MedicionPayload): Observable<any> {
    return this.http.post<any>(this.apiUrlBuilder.build('/user/servicios/registrar-y-cobrar'), payload);
  }

  registrarMasivo(payload: MedicionPayload[]): Observable<any> {
    return this.http.post<any>(this.apiUrlBuilder.build('/user/servicios/masivo'), payload);
  }

  getPendientes(tipo: 'luz' | 'agua' = 'luz'): Observable<any[]> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<any[]>(this.apiUrlBuilder.build('/user/servicios/pendientes'), { params });
  }

  getById(id: number): Observable<Medicion> {
    return this.http.get<Medicion>(`${this.apiUrlBuilder.build('/user/servicios')}/${id}`);
  }

  registrarLectura(payload: MedicionPayload): Observable<Medicion> {
    return this.http.post<Medicion>(this.apiUrlBuilder.build('/user/servicios'), payload);
  }

  update(id: number, payload: Partial<MedicionPayload>): Observable<Medicion> {
    return this.http.put<Medicion>(`${this.apiUrlBuilder.build('/user/servicios')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/servicios')}/${id}`);
  }
}
