import { Injectable, OnDestroy } from '@angular/core';
import { isBrowser } from './motion.config';

export type TickFn = (time: number, deltaMs: number) => void;

interface Subscriber {
  readonly fn: TickFn;
  readonly priority: number;
}

/**
 * A single requestAnimationFrame loop for the whole site, so smooth scroll,
 * scroll-linked effects, the cursor and WebGL all advance in the same frame.
 * Lower priority runs first.
 */
@Injectable({ providedIn: 'root' })
export class TickerService implements OnDestroy {
  private subscribers: Subscriber[] = [];
  private rafId = 0;
  private last = 0;

  add(fn: TickFn, priority = 0): () => void {
    const sub: Subscriber = { fn, priority };
    this.subscribers = [...this.subscribers, sub].sort((a, b) => a.priority - b.priority);
    this.ensureRunning();
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== sub);
    };
  }

  ngOnDestroy(): void {
    if (this.rafId && isBrowser()) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = 0;
    this.subscribers = [];
  }

  private ensureRunning(): void {
    if (this.rafId || !isBrowser() || typeof requestAnimationFrame !== 'function') {
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  private readonly loop = (time: number): void => {
    // Clamp delta so a backgrounded tab doesn't produce a giant jump on return.
    const delta = this.last ? Math.min(64, time - this.last) : 16.7;
    this.last = time;
    for (const sub of this.subscribers) {
      sub.fn(time, delta);
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
}
