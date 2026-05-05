import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionStore } from '../core/auth/session.store';
import {
  DashboardContratoVencer,
  DashboardEstadoCuenta,
  DashboardFinanciero,
  DashboardMorosidad,
  DashboardOcupacion,
  DashboardResumen,
  DashboardTopUnidad
} from '../core/dashboard/dashboard.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);
  private readonly sessionStore = inject(SessionStore);

  private get baseParams(): HttpParams {
    const empresaId = this.sessionStore.empresaId();
    return new HttpParams().set('empresa_id', empresaId ? String(empresaId) : '0');
  }

  getResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(
      this.apiUrlBuilder.build('/user/dashboard'),
      { params: this.baseParams }
    );
  }

  getOcupacion(): Observable<DashboardOcupacion> {
    return this.http.get<DashboardOcupacion>(
      this.apiUrlBuilder.build('/user/dashboard/ocupacion'),
      { params: this.baseParams }
    );
  }

  getMorosidad(): Observable<DashboardMorosidad> {
    return this.http.get<DashboardMorosidad>(
      this.apiUrlBuilder.build('/user/dashboard/morosidad'),
      { params: this.baseParams }
    );
  }

  getFinanciero(desde?: string, hasta?: string): Observable<DashboardFinanciero> {
    let params = this.baseParams;
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<DashboardFinanciero>(
      this.apiUrlBuilder.build('/user/dashboard/financiero'),
      { params }
    );
  }

  getContratosPorVencer(dias?: number): Observable<DashboardContratoVencer[]> {
    let params = this.baseParams;
    if (dias) params = params.set('dias', String(dias));

    return this.http.get<DashboardContratoVencer[]>(
      this.apiUrlBuilder.build('/user/dashboard/contratos-por-vencer'),
      { params }
    );
  }

  getEstadoCuenta(clienteId: number): Observable<DashboardEstadoCuenta> {
    return this.http.get<DashboardEstadoCuenta>(
      `${this.apiUrlBuilder.build('/user/dashboard/estado-cuenta')}/${clienteId}`,
      { params: this.baseParams }
    );
  }

  getTopUnidades(desde?: string, hasta?: string, limite?: number): Observable<DashboardTopUnidad[]> {
    let params = this.baseParams;
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (limite) params = params.set('limite', String(limite));

    return this.http.get<DashboardTopUnidad[]>(
      this.apiUrlBuilder.build('/user/dashboard/top-unidades'),
      { params }
    );
  }
}
