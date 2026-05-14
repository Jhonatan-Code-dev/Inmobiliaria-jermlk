import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../auth/session.store';
import { API_BASE_URL } from '../config/environment';
import { SKIP_AUTH } from './request-context.tokens';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }

  const sessionStore = inject(SessionStore);
  const token = sessionStore.getToken();
  const shouldSkipAuth = req.context.get(SKIP_AUTH);

  let nextRequest = req.clone({ withCredentials: true });

  if (!shouldSkipAuth && token) {
    nextRequest = nextRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(nextRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !shouldSkipAuth) {
        sessionStore.clearSession();
      }

      return throwError(() => error);
    })
  );
};
