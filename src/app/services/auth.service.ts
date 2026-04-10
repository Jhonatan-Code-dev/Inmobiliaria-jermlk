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
import { ApiUrlBuilder } from '../core/http/api-url.builder';
import { SKIP_AUTH } from '../core/http/request-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);
  private readonly sessionStore = inject(SessionStore);

  readonly user = this.sessionStore.user;
  readonly empresa = this.sessionStore.empresa;
  readonly empresaId = this.sessionStore.empresaId;
  readonly isLoggedIn = this.sessionStore.isAuthenticated;

  login(usuario: string, contrasena: string): Observable<LoginResponse> {
    const payload: LoginPayload = {
      usuario: usuario.trim(),
      contrasena
    };

    return this.http
      .post<LoginResponse>(this.apiUrlBuilder.build('/auth/login'), payload, {
        context: new HttpContext().set(SKIP_AUTH, true)
      })
      .pipe(tap((response) => this.sessionStore.setSession(response)));
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiMessageResponse>(this.apiUrlBuilder.build('/auth/logout'), {})
      .pipe(
        map(() => void 0),
        catchError(() => of(void 0)),
        tap(() => this.sessionStore.clearSession())
      );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(this.apiUrlBuilder.build('/me')).pipe(
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
      // We assume empresa_id is available if we have the other data from hydration
      empresa_id: this.sessionStore.empresaId() || 0,
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

  changePassword(password: string): Observable<ApiMessageResponse> {
    return this.http.patch<ApiMessageResponse>(this.apiUrlBuilder.build('/me/password'), { password });
  }

  clearSession(): void {
    this.sessionStore.clearSession();
  }
}
