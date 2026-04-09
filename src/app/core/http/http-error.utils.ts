import { HttpErrorResponse } from '@angular/common/http';

type ErrorPayload = {
  readonly message?: unknown;
};

export const isNetworkError = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && error.status === 0;

export const extractHttpErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as ErrorPayload | null;
    const serverMessage = payload?.message;

    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage.trim();
    }
  }

  return fallbackMessage;
};
