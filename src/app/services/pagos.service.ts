import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { Pago, PagoPayload, PagoPendiente, PagosFilters, PagosListResponse } from '../core/pagos/pagos.models';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: PagosFilters): Observable<PagosListResponse> {
    let params = new HttpParams();
    if (filters.empresa_id) params = params.set('empresa_id', String(filters.empresa_id));
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.por_pagina) params = params.set('por_pagina', String(filters.por_pagina));
    if (filters.buscar) params = params.set('buscar', filters.buscar);

    return this.http.get<PagosListResponse>(this.apiUrlBuilder.build('/user/pagos'), { params });
  }

  getById(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrlBuilder.build('/user/pagos')}/${id}`);
  }

  create(payload: PagoPayload): Observable<Pago> {
    return this.http.post<Pago>(this.apiUrlBuilder.build('/user/pagos'), payload);
  }

  update(id: number, payload: Partial<PagoPayload>): Observable<Pago> {
    return this.http.put<Pago>(`${this.apiUrlBuilder.build('/user/pagos')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/pagos')}/${id}`);
  }

  getPendientesMes(empresaId: number): Observable<PagoPendiente[]> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<PagoPendiente[]>(`${this.apiUrlBuilder.build('/user/pagos')}/pendientes`, { params });
  }
}
