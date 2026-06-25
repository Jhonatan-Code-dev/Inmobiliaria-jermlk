import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage, isNetworkError } from '../core/http/http-error.utils';
import { APP_ROUTE_PATHS } from '../core/routing/app-routes.constants';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(80)]],
    password: ['', [Validators.required, Validators.minLength(3)]]
  });

  isLoading = false;
  error = '';
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error = 'Completa usuario y contrasena.';
      return;
    }

    const { username, password } = this.loginForm.getRawValue();

    this.isLoading = true;
    this.error = '';

    this.authService
      .login(username, password)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(APP_ROUTE_PATHS.menuOverview);
        },
        error: (error: unknown) => {
          if (isNetworkError(error)) {
            this.error =
              'No se pudo conectar con el backend. Verifica BACKEND_URL y que el servidor API este levantado.';
            return;
          }

          this.error = extractHttpErrorMessage(error, 'Credenciales invalidas.');
        }
      });
  }
}
