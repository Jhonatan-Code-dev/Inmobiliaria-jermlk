import { Injectable, computed, signal } from '@angular/core';
import { Empresa, LoginResponse, MeResponse, User } from './auth.models';

type SessionState = {
  readonly token: string | null;
  readonly user: User | null;
  readonly empresa: Empresa | null;
};

const SESSION_STORAGE_KEY = 'alquilamax.session';

@Injectable({
  providedIn: 'root'
})
export class SessionStore {
  private readonly state = signal<SessionState>({
    token: null,
    user: null,
    empresa: null
  });

  readonly user = computed(() => this.state().user);
  readonly empresa = computed(() => this.state().empresa);
  readonly isAuthenticated = computed(() => Boolean(this.state().token));

  constructor() {
    this.hydrateFromStorage();
  }

  getToken(): string | null {
    return this.state().token;
  }

  setSession(session: LoginResponse): void {
    this.commitState({
      token: session.token,
      user: session.user,
      empresa: session.empresa
    });
  }

  syncProfile(profile: MeResponse): void {
    this.commitState({
      token: profile.token || this.state().token,
      user: profile.user,
      empresa: profile.empresa
    });
  }

  clearSession(): void {
    this.commitState({
      token: null,
      user: null,
      empresa: null
    });
  }

  private commitState(nextState: SessionState): void {
    this.state.set(nextState);
    this.persistState(nextState);
  }

  private hydrateFromStorage(): void {
    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    try {
      const raw = storage.getItem(SESSION_STORAGE_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SessionState>;

      this.state.set({
        token: typeof parsed.token === 'string' ? parsed.token : null,
        user: this.isValidUser(parsed.user) ? parsed.user : null,
        empresa: this.isValidEmpresa(parsed.empresa) ? parsed.empresa : null
      });
    } catch {
      storage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private persistState(nextState: SessionState): void {
    const storage = this.getStorage();

    if (!storage) {
      return;
    }

    if (!nextState.token) {
      storage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextState));
  }

  private getStorage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private isValidUser(value: unknown): value is User {
    return typeof value === 'object' && value !== null && 'id' in value && 'usuario' in value;
  }

  private isValidEmpresa(value: unknown): value is Empresa {
    return typeof value === 'object' && value !== null && 'id' in value && 'nombre' in value;
  }
}
