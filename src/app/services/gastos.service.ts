import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  Gasto,
  GastoPayload,
  GastosFilters,
  GastosListResponse,
  MetodoPago
} from '../core/gastos/gastos.models';

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: GastosFilters): Observable<GastosListResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      params = params.set(key, String(value));
    }

    return this.http.get<GastosListResponse>(this.apiUrlBuilder.build('/user/gastos'), { params });
  }

  getMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(this.apiUrlBuilder.build('/user/gastos/tipos-pago'));
  }

  create(payload: GastoPayload): Observable<Gasto> {
    return this.http.post<Gasto>(this.apiUrlBuilder.build('/user/gastos'), payload);
  }

  update(id: number, payload: GastoPayload): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.apiUrlBuilder.build('/user/gastos')}/${id}`, payload);
  }

  delete(id: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));

    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrlBuilder.build('/user/gastos')}/${id}`,
      { params }
    );
  }
}
