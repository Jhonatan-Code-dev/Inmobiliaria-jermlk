import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { DASHBOARD_NAVIGATION_ITEMS } from '../core/layout/dashboard-navigation';
import { APP_ROUTE_PATHS } from '../core/routing/app-routes.constants';
import { ThemeService } from '../core/theme/theme.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly routePaths = APP_ROUTE_PATHS;
  readonly user = this.authService.user;
  readonly empresa = this.authService.empresa;
  readonly navigationItems = DASHBOARD_NAVIGATION_ITEMS;

  readonly isSidebarCollapsed = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly showSidebarLabels = computed(
    () => this.isMobileMenuOpen() || !this.isSidebarCollapsed()
  );

  readonly sidebarClasses = computed(() =>
    [
      'fixed inset-y-0 left-0 z-40 flex w-full max-w-[18rem] flex-col overflow-hidden border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg p-4 transition-all duration-300 ease-in-out',
      this.isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      this.isSidebarCollapsed() ? 'lg:w-[80px]' : 'lg:w-[18rem]'
    ].join(' ')
  );

  readonly mainShellClasses = computed(() =>
    this.isSidebarCollapsed()
      ? 'relative min-h-screen bg-slate-50 dark:bg-dark-bg transition-[padding] duration-300 ease-in-out lg:pl-[80px]'
      : 'relative min-h-screen bg-slate-50 dark:bg-dark-bg transition-[padding] duration-300 ease-in-out lg:pl-[18rem]'
  );

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
        this.router.navigateByUrl(this.routePaths.root);
      });
  }
}
