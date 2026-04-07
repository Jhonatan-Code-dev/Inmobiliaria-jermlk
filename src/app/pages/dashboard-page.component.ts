import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

type DashboardSectionId = 'overview' | 'workspace' | 'profile';
type StatusTone = 'success' | 'warning' | 'danger';

type DashboardNavItem = {
  readonly id: DashboardSectionId;
  readonly label: string;
  readonly helper: string;
  readonly icon: string;
};

type DashboardMetric = {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
  readonly icon: string;
  readonly accent: string;
};

type DashboardDetail = {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
};

type DashboardExperienceNote = {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
};

const NAVIGATION_ITEMS: DashboardNavItem[] = [
  {
    id: 'overview',
    label: 'Resumen',
    helper: 'Vista ejecutiva del panel',
    icon: 'M3 11.5 12 4l9 7.5M5 10.8V20h14v-9.2M9 20v-5h6v5'
  },
  {
    id: 'workspace',
    label: 'Empresa',
    helper: 'Operacion y vigencia',
    icon: 'M4 21h16M8 21V7.6A1.6 1.6 0 0 1 9.6 6h4.8A1.6 1.6 0 0 1 16 7.6V21M10 10h.01M14 10h.01M10 14h.01M14 14h.01'
  },
  {
    id: 'profile',
    label: 'Cuenta',
    helper: 'Sesion y usuario activo',
    icon: 'M16 21v-1.5A4.5 4.5 0 0 0 11.5 15h-3A4.5 4.5 0 0 0 4 19.5V21M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'
  }
];

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

  readonly navigationItems = NAVIGATION_ITEMS;
  readonly isSidebarCollapsed = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly activeSection = signal<DashboardSectionId>('overview');

  readonly shellPanelClass =
    'rounded-[30px] border border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl';
  readonly secondaryPanelClass =
    'rounded-[26px] border border-slate-200/70 bg-white/82 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl';

  readonly showSidebarLabels = computed(() => this.isMobileMenuOpen() || !this.isSidebarCollapsed());

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

  readonly statusTone = computed<StatusTone>(() => {
    const company = this.empresa();

    if (!company?.estado) {
      return 'warning';
    }

    const expiration = new Date(company.vencimiento).getTime();

    if (Number.isNaN(expiration) || expiration < Date.now()) {
      return 'danger';
    }

    return 'success';
  });

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

  readonly statusBadgeClasses = computed(() => {
    switch (this.statusTone()) {
      case 'danger':
        return 'bg-rose-500/15 text-rose-700 ring-1 ring-inset ring-rose-200';
      case 'warning':
        return 'bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-200';
      default:
        return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-200';
    }
  });

  readonly sidebarClasses = computed(() =>
    [
      'fixed inset-y-4 left-4 z-40 flex w-[calc(100vw-2rem)] max-w-[21rem] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/92 p-4 text-slate-50 shadow-[0_32px_90px_rgba(15,23,42,0.36)] backdrop-blur-2xl transition-all duration-300 ease-out',
      this.isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0',
      this.isSidebarCollapsed() ? 'lg:w-24' : 'lg:w-[21rem]'
    ].join(' ')
  );

  readonly mainShellClasses = computed(() =>
    this.isSidebarCollapsed()
      ? 'relative min-h-screen transition-[padding] duration-300 ease-out lg:pl-[8.5rem]'
      : 'relative min-h-screen transition-[padding] duration-300 ease-out lg:pl-[25.5rem]'
  );

  readonly overviewMetrics = computed<DashboardMetric[]>(() => {
    const company = this.empresa();
    const user = this.user();

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
        value: company ? `${company.pais} / ${company.moneda}` : 'Pendiente',
        helper: 'Pais y moneda configurados',
        icon: 'M12 3v18M7 8h7.5a3.5 3.5 0 1 1 0 7H9.5A3.5 3.5 0 0 1 6 11.5',
        accent: 'from-cyan-500/25 via-cyan-400/10 to-transparent text-cyan-700'
      },
      {
        label: 'Capacidad',
        value: company ? `1 / ${company.maximo_usuarios}` : '0 / 0',
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
          this.statusTone() === 'danger'
            ? 'from-rose-500/25 via-orange-400/10 to-transparent text-rose-700'
            : this.statusTone() === 'warning'
              ? 'from-amber-500/25 via-orange-400/10 to-transparent text-amber-700'
              : 'from-emerald-500/25 via-cyan-400/10 to-transparent text-emerald-700'
      }
    ];
  });

  readonly operationalSignals = computed<DashboardMetric[]>(() => {
    const company = this.empresa();
    const user = this.user();

    return [
      {
        label: 'Estado comercial',
        value: this.companyStatusLabel(),
        helper: company?.estado ? 'Operacion habilitada' : 'Revisar configuracion',
        icon: 'M12 3 19 7v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4Z',
        accent:
          this.statusTone() === 'danger'
            ? 'from-rose-500/25 via-orange-400/10 to-transparent text-rose-700'
            : this.statusTone() === 'warning'
              ? 'from-amber-500/25 via-orange-400/10 to-transparent text-amber-700'
              : 'from-emerald-500/25 via-cyan-400/10 to-transparent text-emerald-700'
      },
      {
        label: 'Usuario autenticado',
        value: user?.usuario ?? 'No disponible',
        helper: user ? `ID ${user.id}` : 'Sin sesion local',
        icon: 'M16 21v-1.5A4.5 4.5 0 0 0 11.5 15h-3A4.5 4.5 0 0 0 4 19.5V21M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
        accent: 'from-indigo-500/25 via-sky-400/10 to-transparent text-indigo-700'
      },
      {
        label: 'Modo del menu',
        value: this.isSidebarCollapsed() ? 'Compacto' : 'Expandido',
        helper: 'Se adapta a escritorio y movil',
        icon: 'M4 6h16M4 12h10M4 18h16',
        accent: 'from-slate-500/20 via-slate-400/10 to-transparent text-slate-700'
      }
    ];
  });

  readonly companyDetails = computed<DashboardDetail[]>(() => {
    const company = this.empresa();

    if (!company) {
      return [];
    }

    return [
      {
        label: 'Nombre comercial',
        value: company.nombre,
        icon: 'M4 21h16M8 21V7.6A1.6 1.6 0 0 1 9.6 6h4.8A1.6 1.6 0 0 1 16 7.6V21'
      },
      {
        label: 'Pais de operacion',
        value: company.pais,
        icon: 'M3 12h18M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9Z'
      },
      {
        label: 'Moneda activa',
        value: company.moneda,
        icon: 'M12 3v18M7 8h7.5a3.5 3.5 0 1 1 0 7H9.5A3.5 3.5 0 0 1 6 11.5'
      },
      {
        label: 'Usuarios maximos',
        value: `${company.maximo_usuarios}`,
        icon: 'M16 20v-1.2A4.8 4.8 0 0 0 11.2 14H8.8A4.8 4.8 0 0 0 4 18.8V20M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8'
      },
      {
        label: 'Vencimiento',
        value: this.formatDate(company.vencimiento),
        icon: 'M12 8v5l3 3M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z'
      },
      {
        label: 'Creado en',
        value: this.formatDate(company.creado_en),
        icon: 'M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'
      }
    ];
  });

  readonly accountDetails = computed<DashboardDetail[]>(() => {
    const company = this.empresa();
    const user = this.user();

    if (!user) {
      return [];
    }

    return [
      {
        label: 'Usuario',
        value: user.usuario,
        icon: 'M16 21v-1.5A4.5 4.5 0 0 0 11.5 15h-3A4.5 4.5 0 0 0 4 19.5V21M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'
      },
      {
        label: 'ID de usuario',
        value: `${user.id}`,
        icon: 'M9 7h6M9 12h6M9 17h3M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'
      },
      {
        label: 'Empresa asociada',
        value: company?.nombre ?? 'Sin empresa',
        icon: 'M4 21h16M8 21V7.6A1.6 1.6 0 0 1 9.6 6h4.8A1.6 1.6 0 0 1 16 7.6V21'
      },
      {
        label: 'ID reportado en usuario',
        value: `${user.empresa_id}`,
        icon: 'M12 6v12M6 12h12'
      },
      {
        label: 'Persistencia',
        value: 'Sesion local disponible',
        icon: 'M6 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V3h10v2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6Z'
      },
      {
        label: 'Vista actual',
        value: this.isSidebarCollapsed() ? 'Menu acoplado' : 'Menu desacoplado',
        icon: 'M4 6h16M4 12h10M4 18h16'
      }
    ];
  });

  readonly experienceNotes = computed<DashboardExperienceNote[]>(() => [
    {
      title: 'Menu adaptable',
      description: this.isSidebarCollapsed()
        ? 'El panel esta acoplado para dejar mas espacio al contenido principal.'
        : 'El menu muestra contexto completo y mantiene accesos visibles para trabajar mas rapido.',
      icon: 'M4 6h16M4 12h10M4 18h16'
    },
    {
      title: 'Flujo responsive',
      description: 'En movil el menu se convierte en un panel lateral con overlay para una navegacion mas limpia.',
      icon: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z'
    },
    {
      title: 'Sesion persistente',
      description: 'El dashboard conserva los datos del login para que recargar no rompa la experiencia.',
      icon: 'M12 3 19 7v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4Z'
    }
  ]);

  isLoggingOut = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  navigateToSection(sectionId: DashboardSectionId): void {
    this.activeSection.set(sectionId);
    this.closeMobileMenu();

    const section = globalThis.document?.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  isSectionActive(sectionId: DashboardSectionId): boolean {
    return this.activeSection() === sectionId;
  }

  navItemClasses(sectionId: DashboardSectionId): string {
    return this.isSectionActive(sectionId)
      ? 'group flex w-full items-center gap-3 rounded-2xl bg-white text-slate-950 shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition duration-200'
      : 'group flex w-full items-center gap-3 rounded-2xl text-slate-300 transition duration-200 hover:bg-white/10 hover:text-white';
  }

  navIconClasses(sectionId: DashboardSectionId): string {
    return this.isSectionActive(sectionId)
      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white'
      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-sky-100';
  }

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.closeMobileMenu();

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
