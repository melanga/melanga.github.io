import { Injectable, PLATFORM_ID, inject, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portfolio-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = typeof document !== 'undefined' ? document : null;

  readonly theme = signal<Theme>(this.readInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (isPlatformBrowser(this.platformId) && this.doc?.documentElement) {
        this.doc.documentElement.setAttribute('data-theme', theme);
        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch {
          // ignore
        }
      }
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private readInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) return 'dark';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    const matchMedia = this.doc?.defaultView?.matchMedia;
    if (typeof matchMedia === 'function') {
      try {
        if (matchMedia('(prefers-color-scheme: light)').matches) {
          return 'light';
        }
      } catch {
        // ignore unsupported media queries in test environments
      }
    }
    return 'dark';
  }
}
