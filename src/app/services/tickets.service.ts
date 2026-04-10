import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { Ticket, TicketPayload, TicketsFilters, TicketsListResponse } from '../core/tickets/tickets.models';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: TicketsFilters): Observable<TicketsListResponse> {
    let params = new HttpParams();
    if (filters.pag) params = params.set('pag', String(filters.pag));
    if (filters.por_pagina) params = params.set('por_pagina', String(filters.por_pagina));
    if (filters.buscar) params = params.set('buscar', filters.buscar);

    return this.http.get<TicketsListResponse>(this.apiUrlBuilder.build('/user/tickets'), { params });
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrlBuilder.build('/user/tickets')}/${id}`);
  }

  create(payload: TicketPayload): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrlBuilder.build('/user/tickets'), payload);
  }

  update(id: number, payload: Partial<TicketPayload>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrlBuilder.build('/user/tickets')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/tickets')}/${id}`);
  }
}
