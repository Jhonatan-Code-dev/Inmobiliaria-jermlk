import { InjectionToken } from '@angular/core';

/**
 * Este archivo NO contiene valores hardcodeados.
 * Gracias a @ngx-env/builder, las variables se leen directamente del archivo .env
 * en la raiz del proyecto usando import.meta.env.
 */

export const API_URL = (import.meta as any).env?.NG_APP_BACKEND_URL || '';
export const IS_PRODUCTION = (import.meta as any).env?.NODE_ENV === 'production';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => API_URL
});
