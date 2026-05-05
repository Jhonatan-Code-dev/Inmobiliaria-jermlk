import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  
  // Initialize with 'system' as default, but check localStorage immediately if in browser
  readonly currentTheme = signal<Theme>('system');
  readonly isDarkActive = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (storedTheme) {
        this.currentTheme.set(storedTheme);
      }

      // Effect to apply classes and save to localStorage when theme changes
      effect(() => {
        const theme = this.currentTheme();
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
      });

      // Listen for system theme changes if set to 'system'
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme() === 'system') {
          this.isDarkActive.set(e.matches);
          this.updateDocumentClass(e.matches);
        }
      });
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  toggleDarkLight(): void {
    const isCurrentlyDark = this.isDarkActive();
    this.setTheme(isCurrentlyDark ? 'light' : 'dark');
  }

  private applyTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let isDark = false;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    this.isDarkActive.set(isDark);
    this.updateDocumentClass(isDark);
  }

  private updateDocumentClass(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
