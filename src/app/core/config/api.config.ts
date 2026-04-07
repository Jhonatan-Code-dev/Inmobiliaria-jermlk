import { InjectionToken, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl.replace(/\/+$/, '')
});

export function injectApiBaseUrl(): string {
  return inject(API_BASE_URL);
}

export function buildApiUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  if (/^https?:\/\//i.test(normalizedBase)) {
    return new URL(normalizedEndpoint, `${normalizedBase}/`).toString();
  }

  return `${normalizedBase}/${normalizedEndpoint}`;
}
