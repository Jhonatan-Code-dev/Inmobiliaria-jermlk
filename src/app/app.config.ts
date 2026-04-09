import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './core/http/auth.interceptor';
import { API_BASE_URL } from './core/config/api.config';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    provideAppInitializer(() => inject(AuthService).restoreSession())
  ]
};
