import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { 
  Ticket, 
  TicketPayload, 
  TicketsFilters, 
  TicketsListResponse,
  TicketsResumen,
  TicketEstado,
  TicketsConfig
} from '../core/tickets/tickets.models';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  list(filters: TicketsFilters): Observable<TicketsListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<TicketsListResponse>(this.apiUrlBuilder.build('/user/tickets'), { params });
  }

  getColaTrabajo(filters: Partial<TicketsFilters>): Observable<TicketsListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<TicketsListResponse>(this.apiUrlBuilder.build('/user/tickets/cola-trabajo'), { params });
  }

  getResumen(propiedad_id?: number): Observable<TicketsResumen> {
    let params = new HttpParams();
    if (propiedad_id) params = params.set('propiedad_id', String(propiedad_id));
    return this.http.get<TicketsResumen>(this.apiUrlBuilder.build('/user/tickets/resumen'), { params });
  }

  getConfigFormulario(): Observable<TicketsConfig> {
    return this.http.get<TicketsConfig>(this.apiUrlBuilder.build('/user/tickets/config-formulario'));
  }

  getUnidadesByInmueble(inmuebleId: number, empresaId: number): Observable<any[]> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<any[]>(this.apiUrlBuilder.build(`/user/inmuebles/${inmuebleId}/unidades`), { params });
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

  cambiarEstado(id: number, estado: TicketEstado): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/tickets')}/${id}/estado`, { estado });
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/tickets')}/${id}`);
  }
}
