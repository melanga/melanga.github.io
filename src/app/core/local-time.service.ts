import { Injectable, OnDestroy, signal } from '@angular/core';
import { SITE } from './site.config';
import { isBrowser } from './motion.config';

/** The current time where Melanga is — ticking once a second. */
@Injectable({ providedIn: 'root' })
export class LocalTimeService implements OnDestroy {
  private readonly formatter = this.createFormatter();
  private readonly timer: ReturnType<typeof setInterval> | null = null;

  readonly time = signal(this.format());

  constructor() {
    if (isBrowser()) {
      this.timer = setInterval(() => this.time.set(this.format()), 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private format(): string {
    try {
      return this.formatter ? this.formatter.format(new Date()) : '';
    } catch {
      return '';
    }
  }

  private createFormatter(): Intl.DateTimeFormat | null {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: SITE.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return null;
    }
  }
}
