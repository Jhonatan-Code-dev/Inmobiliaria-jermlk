import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessageResponse } from '../core/auth/auth.models';
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import {
  Alquiler,
  AlquilerPayload,
  AlquileresFilters,
  AlquileresListResponse,
  PagoPayload,
  PagoPendiente,
  PagoResponse,
  Plantilla,
  GenerarDocumentoResponse,
  GeneradorBorradorPayload
} from '../core/alquileres/alquileres.models';

@Injectable({
  providedIn: 'root'
})
export class AlquileresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  // --- Alquileres CRUD ---
  list(filters: AlquileresFilters): Observable<AlquileresListResponse> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }

    return this.http.get<AlquileresListResponse>(this.apiUrlBuilder.build('/user/alquileres'), { params });
  }

  getById(id: number, empresaId: number): Observable<Alquiler> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<Alquiler>(`${this.apiUrlBuilder.build('/user/alquileres')}/${id}`, { params });
  }

  create(payload: AlquilerPayload): Observable<Alquiler> {
    return this.http.post<Alquiler>(this.apiUrlBuilder.build('/user/alquileres'), payload);
  }

  update(id: number, payload: Partial<AlquilerPayload>): Observable<Alquiler> {
    return this.http.put<Alquiler>(`${this.apiUrlBuilder.build('/user/alquileres')}/${id}`, payload);
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/alquileres')}/${id}`);
  }

  finalizarAlquiler(id: number): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/alquileres')}/${id}/terminar`, {});
  }

  // --- Pagos ---
  registrarPago(payload: PagoPayload): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(this.apiUrlBuilder.build('/user/pagos'), payload);
  }

  getPagosPendientes(empresaId: number): Observable<PagoPendiente[]> {
    const params = new HttpParams().set('empresa_id', String(empresaId));
    return this.http.get<PagoPendiente[]>(`${this.apiUrlBuilder.build('/user/pagos')}/pendientes`, { params });
  }

  // --- Plantillas ---
  getPlantillas(): Observable<Plantilla[]> {
    return this.http.get<Plantilla[]>(this.apiUrlBuilder.build('/user/alquileres/plantillas'));
  }

  savePlantilla(payload: { id: number, nombre: string, contenido: string }): Observable<Plantilla> {
    return this.http.post<Plantilla>(this.apiUrlBuilder.build('/user/alquileres/plantillas'), payload);
  }

  deletePlantilla(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrlBuilder.build('/user/alquileres/plantillas')}/${id}`);
  }

  // --- Generación de Contratos (Unificado a Word) ---
  generarDocumentoWord(alquilerId: number, plantillaId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (plantillaId && plantillaId > 0) {
      params = params.set('plantilla_id', String(plantillaId));
    }
    return this.http.get(`${this.apiUrlBuilder.build('/user/alquileres')}/${alquilerId}/descargar-word`, {
      params,
      responseType: 'blob'
    });
  }

  generarBorradorWord(payload: any): Observable<Blob> {
    return this.http.post(this.apiUrlBuilder.build('/user/alquileres/generar-borrador'), payload, {
      responseType: 'blob'
    });
  }

  descargarDocumento(alquilerId: number, tipo: 'pdf' | 'word', plantillaId?: number): Observable<Blob> {
    let params = new HttpParams();
    if (plantillaId && plantillaId > 0) {
      params = params.set('plantilla_id', String(plantillaId));
    }
    return this.http.get(`${this.apiUrlBuilder.build('/user/alquileres')}/${alquilerId}/descargar-${tipo}`, {
      params,
      responseType: 'blob'
    });
  }
}
