import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  Cliente,
  ClientePayload,
  ClientesFilters,
  ClientesListResponse,
  TipoIdentificacion
} from '../core/clientes/clientes.models';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  getTiposIdentificacion(): Observable<TipoIdentificacion[]> {
    return this.http.get<TipoIdentificacion[]>(
      `${this.apiUrlBuilder.build('/user/clientes')}/tipos-identificacion`
    );
  }

  list(filters: ClientesFilters): Observable<ClientesListResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }

    return this.http.get<ClientesListResponse>(this.apiUrlBuilder.build('/user/clientes'), { params });
  }

  getById(id: number, empresaId: number): Observable<Cliente> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Cliente>(`${this.apiUrlBuilder.build('/user/clientes')}/${id}`, { params });
  }

  create(payload: ClientePayload): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrlBuilder.build('/user/clientes'), payload);
  }

  update(id: number, payload: ClientePayload): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrlBuilder.build('/user/clientes')}/${id}`, payload);
  }

  delete(id: number, empresaId: number): Observable<ApiMessageResponse> {
    const params = new HttpParams().set('empresa_id', String(empresaId));

    return this.http.delete<ApiMessageResponse>(
      `${this.apiUrlBuilder.build('/user/clientes')}/${id}`,
      { params }
    );
  }
}
