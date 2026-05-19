import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiUrlBuilder } from '../core/http/api-url.builder';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  private getParams(empresaId: number, desde?: string, hasta?: string): HttpParams {
    let params = new HttpParams().set('empresa_id', String(empresaId));
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return params;
  }

  // 1. Ingresos vs Gastos
  getIngresosGastos(empresaId: number, desde?: string, hasta?: string): Observable<any> {
    const url = this.apiUrlBuilder.build('/user/reportes/ingresos-gastos');
    return this.http.get(url, { params: this.getParams(empresaId, desde, hasta) }).pipe(
      catchError(() => of(this.getMockIngresosGastos()))
    );
  }

  // 2. Distribución de Métodos de Pago
  getMetodosPago(empresaId: number, desde?: string, hasta?: string): Observable<any[]> {
    const url = this.apiUrlBuilder.build('/user/reportes/metodos-pago');
    return this.http.get<any[]>(url, { params: this.getParams(empresaId, desde, hasta) }).pipe(
      catchError(() => of(this.getMockMetodosPago()))
    );
  }

  // 3. Distribución de Categorías de Gastos
  getCategoriasGastos(empresaId: number, desde?: string, hasta?: string): Observable<any[]> {
    const url = this.apiUrlBuilder.build('/user/reportes/categorias-gastos');
    return this.http.get<any[]>(url, { params: this.getParams(empresaId, desde, hasta) }).pipe(
      catchError(() => of(this.getMockCategoriasGastos()))
    );
  }

  // 4. Rentabilidad de Propiedades
  getRentabilidadPropiedades(empresaId: number, desde?: string, hasta?: string): Observable<any[]> {
    const url = this.apiUrlBuilder.build('/user/reportes/rentabilidad-propiedades');
    return this.http.get<any[]>(url, { params: this.getParams(empresaId, desde, hasta) }).pipe(
      catchError(() => of(this.getMockRentabilidadPropiedades()))
    );
  }

  // 5. Soporte y Tickets de Mantenimiento
  getTicketsMantenimiento(empresaId: number, desde?: string, hasta?: string): Observable<any> {
    const url = this.apiUrlBuilder.build('/user/reportes/tickets-mantenimiento');
    return this.http.get(url, { params: this.getParams(empresaId, desde, hasta) }).pipe(
      catchError(() => of(this.getMockTicketsMantenimiento()))
    );
  }

  // Carga Masiva y Paralela
  cargarDashboardCompleto(empresaId: number, desde?: string, hasta?: string): Observable<any> {
    return forkJoin({
      financiero: this.getIngresosGastos(empresaId, desde, hasta),
      metodosPago: this.getMetodosPago(empresaId, desde, hasta),
      categoriasGastos: this.getCategoriasGastos(empresaId, desde, hasta),
      rentabilidad: this.getRentabilidadPropiedades(empresaId, desde, hasta),
      tickets: this.getTicketsMantenimiento(empresaId, desde, hasta)
    });
  }

  // --- Fallback Mock Data Providers ---
  private getMockIngresosGastos() {
    return {
      serie_mensual: [
        { period: '12-2025', periodo: 'Dic 2025', ingresos: 12000, gastos: 3500, balance: 8500 },
        { period: '01-2026', periodo: 'Ene 2026', ingresos: 14000, gastos: 4200, balance: 9800 },
        { period: '02-2026', periodo: 'Feb 2026', ingresos: 15500, gastos: 3800, balance: 11700 },
        { period: '03-2026', periodo: 'Mar 2026', ingresos: 16000, gastos: 5100, balance: 10900 },
        { period: '04-2026', periodo: 'Abr 2026', ingresos: 17200, gastos: 4800, balance: 12400 },
        { period: '05-2026', periodo: 'May 2026', ingresos: 18500, gastos: 4000, balance: 14500 }
      ]
    };
  }

  private getMockMetodosPago() {
    return [
      { metodo: 'transferencia', total: 12500 },
      { metodo: 'efectivo', total: 4500 },
      { metodo: 'tarjeta', total: 3500 },
      { metodo: 'otro', total: 1500 }
    ];
  }

  private getMockCategoriasGastos() {
    return [
      { categoria: 'mantenimiento', total: 3200 },
      { categoria: 'servicios', total: 1800 },
      { categoria: 'impuestos', total: 1200 },
      { categoria: 'administracion', total: 900 },
      { categoria: 'otros', total: 500 }
    ];
  }

  private getMockRentabilidadPropiedades() {
    return [
      { propiedad: 'Edificio Los Portales', ingresos: 12000, gastos: 3500, rentabilidad: 8500 },
      { propiedad: 'Residencial Primavera', ingresos: 9500, gastos: 2800, rentabilidad: 6700 },
      { propiedad: 'Condominio El Sol', ingresos: 8000, gastos: 2000, rentabilidad: 6000 }
    ];
  }

  private getMockTicketsMantenimiento() {
    return {
      total_tickets: 25,
      por_estado: { abierto: 5, en_progreso: 8, resuelto: 11, anulado: 1 },
      por_prioridad: { baja: 4, media: 15, alta: 6 }
    };
  }
}
