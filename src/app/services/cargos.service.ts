import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { Cargo, CargoPayload, CargosFilters, CargosListResponse } from '../core/cargos/cargos.models';

@Injectable({
  providedIn: 'root'
})
export class CargosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: CargosFilters): Observable<CargosListResponse> {
    let params = new HttpParams();
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.por_pagina) params = params.set('por_pagina', String(filters.por_pagina));
    if (filters.buscar) params = params.set('buscar', filters.buscar);

    return this.http.get<CargosListResponse>(this.apiUrlBuilder.build('/user/cargos'), { params });
  }

  getById(id: number): Observable<Cargo> {
    return this.http.get<Cargo>(`${this.apiUrlBuilder.build('/user/cargos')}/${id}`);
  }

  create(payload: CargoPayload): Observable<Cargo> {
    return this.http.post<Cargo>(this.apiUrlBuilder.build('/user/cargos'), payload);
  }

  update(id: number, payload: Partial<CargoPayload>): Observable<Cargo> {
    return this.http.put<Cargo>(`${this.apiUrlBuilder.build('/user/cargos')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/cargos')}/${id}`);
  }
}
