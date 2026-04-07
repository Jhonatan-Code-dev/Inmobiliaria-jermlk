import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, tap, timeout } from 'rxjs';
import {
  ApiMessageResponse,
  LoginPayload,
  LoginResponse,
  MeResponse
} from '../core/auth/auth.models';
import { SessionStore } from '../core/auth/session.store';
import { buildApiUrl, injectApiBaseUrl } from '../core/config/api.config';
import { SKIP_AUTH } from '../core/http/request-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = injectApiBaseUrl();
  private readonly sessionStore = inject(SessionStore);

  readonly user = this.sessionStore.user;
  readonly empresa = this.sessionStore.empresa;
  readonly isLoggedIn = this.sessionStore.isAuthenticated;

  login(usuario: string, contrasena: string): Observable<LoginResponse> {
    const payload: LoginPayload = {
      usuario: usuario.trim(),
      contrasena
    };

    return this.http
      .post<LoginResponse>(buildApiUrl(this.apiBaseUrl, '/auth/login'), payload, {
        context: new HttpContext().set(SKIP_AUTH, true)
      })
      .pipe(tap((response) => this.sessionStore.setSession(response)));
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiMessageResponse>(buildApiUrl(this.apiBaseUrl, '/auth/logout'), {})
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
        tap(() => this.sessionStore.clearSession())
      );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(buildApiUrl(this.apiBaseUrl, '/me')).pipe(
      tap((response) => this.sessionStore.syncProfile(response))
    );
  }

  restoreSession(): Observable<MeResponse | null> {
    const token = this.sessionStore.getToken();
    const user = this.sessionStore.user();
    const empresa = this.sessionStore.empresa();

    if (!token || !user || !empresa) {
      return of(null);
    }

    const fallbackSession: MeResponse = {
      token,
      user,
      empresa
    };

    return this.getMe().pipe(
      timeout(5000),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.sessionStore.clearSession();
          return of(null);
        }

        return of(fallbackSession);
      })
    );
  }

  clearSession(): void {
    this.sessionStore.clearSession();
  }
}
