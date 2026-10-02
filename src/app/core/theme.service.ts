import { Injectable, PLATFORM_ID, inject, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { prefersReducedMotion } from './motion.config';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portfolio-theme';

interface ViewTransitionLike {
  readonly ready: Promise<void>;
}

type DocumentWithTransitions = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

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

  /**
   * Flips the theme. Where the View Transitions API exists, the new theme
   * spreads out as a circle from the point that was clicked.
   */
  toggleTheme(origin?: { x: number; y: number }): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    const doc = this.doc as DocumentWithTransitions | null;

    if (!doc?.startViewTransition || prefersReducedMotion() || !origin) {
      this.theme.set(next);
      return;
    }

    const root = doc.documentElement;
    root.style.setProperty('--vt-x', `${origin.x}px`);
    root.style.setProperty('--vt-y', `${origin.y}px`);
    doc.startViewTransition(() => {
      this.theme.set(next);
      root.setAttribute('data-theme', next);
    });
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
