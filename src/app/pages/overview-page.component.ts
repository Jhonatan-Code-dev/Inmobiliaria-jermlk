import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  CompanyStatusTone,
  formatDateTime,
  getCompanyStatusLabel,
  getCompanyStatusTone,
  getDaysRemainingLabel
} from '../core/company/company-status.utils';
import { AuthService } from '../services/auth.service';

type OverviewMetric = {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly icon: string;
  readonly accent: string;
};

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview-page.component.html'
})
export class OverviewPageComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly empresa = this.authService.empresa;

  readonly shellPanelClass =
    'rounded-[30px] border border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl';
  readonly secondaryPanelClass =
    'rounded-[26px] border border-slate-200/70 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl';

  readonly companyStatusLabel = computed(() => getCompanyStatusLabel(this.empresa()));

  readonly expirationLabel = computed(() => formatDateTime(this.empresa()?.vencimiento));

  readonly daysRemainingLabel = computed(() => getDaysRemainingLabel(this.empresa()));

  readonly statusTone = computed<CompanyStatusTone>(() =>
    getCompanyStatusTone(this.empresa())
  );

  readonly heroPanelToneClasses = computed(() => {
    switch (this.statusTone()) {
      case 'danger':
        return 'from-rose-100 via-orange-50 to-white';
      case 'warning':
        return 'from-amber-100 via-orange-50 to-white';
      default:
        return 'from-sky-100 via-cyan-50 to-white';
    }
  });

  readonly overviewMetrics = computed<OverviewMetric[]>(() => {
    const company = this.empresa();
    const user = this.user();
    const statusTone = this.statusTone();

    return [
      {
        label: 'Empresa conectada',
        value: company?.nombre ?? 'Sin empresa',
        helper: company ? `ID ${company.id}` : 'Esperando datos',
        icon: 'M4 21h16M8 21V7.6A1.6 1.6 0 0 1 9.6 6h4.8A1.6 1.6 0 0 1 16 7.6V21M10 10h.01M14 10h.01M10 14h.01M14 14h.01',
        accent: 'from-sky-500/25 via-sky-400/10 to-transparent text-sky-700'
      },
      {
        label: 'Operacion base',
        value: company ? `${company.pais ?? 'N/A'} / ${company.moneda}` : 'Pendiente',
        helper: 'Pais y moneda configurados',
        icon: 'M12 3v18M7 8h7.5a3.5 3.5 0 1 1 0 7H9.5A3.5 3.5 0 0 1 6 11.5',
        accent: 'from-cyan-500/25 via-cyan-400/10 to-transparent text-cyan-700'
      },
      {
        label: 'Capacidad',
        value: company ? `1 / ${company.maximo_usuarios ?? 1}` : '0 / 0',
        helper: user ? `Acceso activo: ${user.usuario}` : 'Sin usuario',
        icon: 'M16 20v-1.2A4.8 4.8 0 0 0 11.2 14H8.8A4.8 4.8 0 0 0 4 18.8V20M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 8h4M20 6v4',
        accent: 'from-violet-500/25 via-fuchsia-400/10 to-transparent text-violet-700'
      },
      {
        label: 'Renovacion',
        value: this.daysRemainingLabel(),
        helper: this.expirationLabel(),
        icon: 'M12 8v5l3 3M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z',
        accent:
          statusTone === 'danger'
            ? 'from-rose-500/25 via-orange-400/10 to-transparent text-rose-700'
            : statusTone === 'warning'
              ? 'from-amber-500/25 via-orange-400/10 to-transparent text-amber-700'
            : 'from-emerald-500/25 via-cyan-400/10 to-transparent text-emerald-700'
      }
    ];
  });
}
