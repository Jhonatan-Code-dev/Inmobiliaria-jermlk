import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  usuario: string;
  empresa_id: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  pais: string;
  moneda: string;
  maximo_usuarios: number;
  estado: boolean;
  vencimiento: string;
  creado_en: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  empresa: Empresa;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl; 

  private readonly userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  private readonly empresaSubject = new BehaviorSubject<Empresa | null>(this.getStoredEmpresa());

  readonly user$ = this.userSubject.asObservable();
  readonly empresa$ = this.empresaSubject.asObservable();

  get isLoggedIn(): boolean {
    return !!this.readStorage('token_usuario');
  }

  login(usuario: string, contrasena: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { usuario, contrasena }).pipe(
      tap(res => {
        this.writeStorage('token_usuario', res.token);
        this.writeStorage('user_data', JSON.stringify(res.user));
        this.writeStorage('empresa_data', JSON.stringify(res.empresa));
        
        this.userSubject.next(res.user);
        this.empresaSubject.next(res.empresa);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession()
    });
  }

  getMe(): Observable<{ user: User, empresa: Empresa }> {
    return this.http.get<{ user: User, empresa: Empresa }>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        this.userSubject.next(res.user);
        this.empresaSubject.next(res.empresa);
      })
    );
  }

  private clearSession(): void {
    this.removeStorage('token_usuario');
    this.removeStorage('user_data');
    this.removeStorage('empresa_data');
    this.userSubject.next(null);
    this.empresaSubject.next(null);
  }

  private getStoredUser(): User | null {
    try {
      const data = this.readStorage('user_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getStoredEmpresa(): Empresa | null {
    try {
      const data = this.readStorage('empresa_data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage quota/private mode errors and keep session in memory.
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors during logout cleanup.
    }
  }
}
