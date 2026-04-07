import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  isLoading = false;
  error = '';
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (!this.username || !this.password) {
      this.error = 'Completa usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService
      .login(this.username, this.password)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/menu');
        },
        error: (err) => {
          if (err?.status === 0) {
            this.error = 'No se pudo conectar con el backend. Verifica BACKEND_URL y que el servidor API esté levantado.';
            return;
          }

          this.error = err?.error?.message || 'Credenciales inválidas.';
        }
      });
  }
}
