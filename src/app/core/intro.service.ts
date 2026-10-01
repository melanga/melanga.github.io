import { Injectable, computed, signal } from '@angular/core';
import { isBrowser, prefersReducedMotion } from './motion.config';

export type IntroPhase = 'booting' | 'training' | 'revealing' | 'done';

const SESSION_KEY = 'signal-intro-seen';

/**
 * Orchestrates the opening sequence: the "training run" preloader converges the
 * particle field from noise into a portrait, then hands over to the hero reveal.
 */
@Injectable({ providedIn: 'root' })
export class IntroService {
  readonly phase = signal<IntroPhase>('booting');
  /** True once page content may animate in. */
  readonly revealed = computed(() => this.phase() === 'revealing' || this.phase() === 'done');
  readonly fieldReady = signal(false);

  /** Full ceremony on first visit; a quick converge on repeat visits in the same session. */
  readonly firstVisit: boolean;
  readonly skip: boolean;

  private trainingStart = 0;
  private trainingDuration = 1;

  constructor() {
    this.skip = !isBrowser() || prefersReducedMotion();
    let seen = false;
    try {
      seen = isBrowser() && sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // storage unavailable — treat as first visit
    }
    this.firstVisit = !seen;
    if (this.skip) {
      this.phase.set('done');
    }
  }

  beginTraining(durationMs: number): void {
    this.trainingStart = performance.now();
    this.trainingDuration = Math.max(1, durationMs);
    this.phase.set('training');
  }

  /** 0 → 1 over the training run; 1 once the intro is over. */
  trainingProgress(now = performance.now()): number {
    const p = this.phase();
    if (p === 'booting') return 0;
    if (p !== 'training') return 1;
    return Math.min(1, (now - this.trainingStart) / this.trainingDuration);
  }

  reveal(): void {
    this.phase.set('revealing');
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }
  }

  finish(): void {
    this.phase.set('done');
  }
}
