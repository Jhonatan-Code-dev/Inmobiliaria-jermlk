import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly empresa = this.authService.empresa;

  readonly companyStatusLabel = computed(() => {
    const company = this.empresa();

    if (!company) {
      return 'Sin empresa';
    }

    return company.estado ? 'Activa' : 'Inactiva';
  });

  readonly expirationLabel = computed(() => {
    const company = this.empresa();

    if (!company?.vencimiento) {
      return 'Sin fecha';
    }

    return this.formatDate(company.vencimiento);
  });

  readonly daysRemainingLabel = computed(() => {
    const company = this.empresa();

    if (!company?.vencimiento) {
      return 'Sin vencimiento';
    }

    const now = new Date();
    const expiration = new Date(company.vencimiento);
    const diffInDays = Math.ceil((expiration.getTime() - now.getTime()) / 86_400_000);

    if (Number.isNaN(diffInDays)) {
      return 'Fecha invalida';
    }

    if (diffInDays < 0) {
      return 'Vencida';
    }

    if (diffInDays === 0) {
      return 'Vence hoy';
    }

    if (diffInDays === 1) {
      return '1 dia restante';
    }

    return `${diffInDays} dias restantes`;
  });

  readonly statusTone = computed(() => {
    const company = this.empresa();

    if (!company?.estado) {
      return 'warning';
    }

    const now = Date.now();
    const expiration = new Date(company.vencimiento).getTime();

    if (Number.isNaN(expiration) || expiration < now) {
      return 'danger';
    }

    return 'success';
  });

  isLoggingOut = false;

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    this.authService
      .logout()
      .pipe(finalize(() => (this.isLoggingOut = false)))
      .subscribe(() => {
        this.router.navigateByUrl('/login');
      });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date);
  }
}
