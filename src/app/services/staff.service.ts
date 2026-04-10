import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { StaffFilters, StaffListResponse, StaffMember, StaffPayload } from '../core/staff/staff.models';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: StaffFilters): Observable<StaffListResponse> {
    let params = new HttpParams();
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.por_pagina) params = params.set('por_pagina', String(filters.por_pagina));
    if (filters.buscar) params = params.set('buscar', filters.buscar);

    return this.http.get<StaffListResponse>(this.apiUrlBuilder.build('/user/staff'), { params });
  }

  getById(id: number): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.apiUrlBuilder.build('/user/staff')}/${id}`);
  }

  create(payload: StaffPayload): Observable<StaffMember> {
    return this.http.post<StaffMember>(this.apiUrlBuilder.build('/user/staff'), payload);
  }

  update(id: number, payload: Partial<StaffPayload>): Observable<StaffMember> {
    return this.http.put<StaffMember>(`${this.apiUrlBuilder.build('/user/staff')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/staff')}/${id}`);
  }
}
