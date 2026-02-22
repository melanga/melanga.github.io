import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';

export const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(max-width: 767px)',
  laptop: '(max-width: 1023px)',
  desktop: '(max-width: 1279px)',
  widescreen: '(max-width: 1535px)',
} as const;

@Injectable({ providedIn: 'root' })
export class ResponsiveService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isMobileMatch = toSignal(
    this.breakpointObserver.observe(breakpoints.mobile).pipe(map((m) => m.matches)),
    { initialValue: false },
  );

  private readonly isTabletMatch = toSignal(
    this.breakpointObserver.observe(breakpoints.tablet).pipe(map((m) => m.matches)),
    { initialValue: false },
  );

  readonly isMobile = this.isMobileMatch;
  readonly isTablet = this.isTabletMatch;
  readonly showCustomCursor = computed(() => !this.isTabletMatch());
}
