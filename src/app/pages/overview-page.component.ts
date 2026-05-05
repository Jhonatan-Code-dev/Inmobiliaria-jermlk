import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-page.component.html'
})
export class OverviewPageComponent {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  readonly user = this.authService.user;
  readonly empresa = this.authService.empresa;

  // KPIs
  readonly resumen = toSignal(this.dashboardService.getResumen());
  readonly ocupacion = toSignal(this.dashboardService.getOcupacion());
  readonly morosidad = toSignal(this.dashboardService.getMorosidad());
  readonly financiero = toSignal(this.dashboardService.getFinanciero());
  readonly contratosVencer = toSignal(this.dashboardService.getContratosPorVencer());
  readonly topUnidades = toSignal(this.dashboardService.getTopUnidades());

  readonly shellPanelClass =
    'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';
  readonly secondaryPanelClass =
    'rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-5';

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    const moneda = this.empresa()?.moneda || 'USD';
    return new Intl.NumberFormat('es', { style: 'currency', currency: moneda }).format(amount);
  }

  formatMonth(periodo: string): string {
    if (!periodo) return '';
    const [year, month] = periodo.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  }
}
