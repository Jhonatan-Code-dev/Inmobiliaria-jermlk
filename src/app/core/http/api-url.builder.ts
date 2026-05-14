import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiUrlBuilder {
  private readonly apiBaseUrl = inject(API_BASE_URL);

  build(endpoint: string): string {
    const normalizedBase = this.apiBaseUrl.replace(/\/+$/, '');
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return `${normalizedBase}/${normalizedEndpoint}`;
  }
}
