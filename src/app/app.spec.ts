import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders login content on root when there is no session', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Iniciar sesi');
  });

  it('renders dashboard content when a persisted session exists', async () => {
    localStorage.setItem(
      'alquilamax.session',
      JSON.stringify({
        token: 'demo-token',
        user: {
          id: 5,
          usuario: 'demo',
          empresa_id: 25
        },
        empresa: {
          id: 25,
          nombre: 'Empresa Demo',
          pais: 'PE',
          moneda: 'PEN',
          maximo_usuarios: 4,
          estado: true,
          vencimiento: '2026-04-07T03:20:50Z',
          creado_en: '2026-04-06T02:38:00Z'
        }
      })
    );

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/menu');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Panel Inmobiliario');
    expect(fixture.nativeElement.textContent).toContain('Empresa Demo');
  });
});
