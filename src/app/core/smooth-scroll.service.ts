import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import Lenis from 'lenis';
import { TickerService } from './ticker.service';
import { isBrowser, prefersReducedMotion } from './motion.config';

export interface ScrollToOptions {
  readonly offset?: number;
  readonly duration?: number;
  readonly immediate?: boolean;
}

/** Absolute document offset, ignoring transforms (parallax must not skew measurements). */
export function absoluteTop(el: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

const easeInOutExpo = (t: number): number =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

/**
 * Lenis-powered inertial scrolling, driven from the shared ticker. Falls back to
 * native scrolling for reduced-motion users. Exposes scroll state as plain fields
 * (read inside rAF callbacks) plus an `activeSection` signal for the UI.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService implements OnDestroy {
  private readonly ticker = inject(TickerService);
  private lenis: Lenis | null = null;
  private removeTick: (() => void) | null = null;
  private teardownNative: (() => void) | null = null;
  private readonly sections = new Map<string, HTMLElement>();
  private sectionTops: { id: string; top: number }[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private initialised = false;
  /** Outstanding scroll locks (preloader, overlay, menu) — scrolling resumes at zero. */
  private locks = 0;

  /** Viewport height, refreshed on resize. */
  vh = 800;
  vw = 1200;

  readonly activeSection = signal<string>('top');

  get y(): number {
    if (this.lenis) return this.lenis.scroll;
    return isBrowser() ? window.scrollY : 0;
  }

  /** Signed scroll velocity in px per frame (0 when idle). */
  get velocity(): number {
    return this.lenis?.velocity ?? 0;
  }

  get limit(): number {
    if (this.lenis) return this.lenis.limit;
    return isBrowser() ? document.documentElement.scrollHeight - window.innerHeight : 1;
  }

  init(): void {
    if (!isBrowser() || this.initialised) return;
    this.initialised = true;
    this.measureViewport();

    if (!prefersReducedMotion() && typeof window.matchMedia === 'function') {
      try {
        this.lenis = new Lenis({
          autoRaf: false,
          lerp: 0.085,
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.25,
          stopInertiaOnNavigate: true,
        });
        this.removeTick = this.ticker.add((time) => this.lenis?.raf(time), -100);
      } catch {
        // Unsupported environment — native scrolling still works.
        this.lenis = null;
      }
    }
    // A lock may have been requested before init (e.g. by the preloader).
    this.applyLock();

    const onResize = (): void => {
      this.measureViewport();
      this.measureSections();
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.teardownNative = () => window.removeEventListener('resize', onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.lenis?.resize();
        this.measureSections();
      });
      this.resizeObserver.observe(document.body);
    }

    this.ticker.add(() => this.updateActiveSection(), -90);
  }

  ngOnDestroy(): void {
    this.removeTick?.();
    this.teardownNative?.();
    this.resizeObserver?.disconnect();
    this.lenis?.destroy();
    this.lenis = null;
  }

  registerSection(id: string, el: HTMLElement): () => void {
    this.sections.set(id, el);
    this.measureSections();
    return () => {
      this.sections.delete(id);
      this.measureSections();
    };
  }

  scrollTo(target: string | HTMLElement | number, options: ScrollToOptions = {}): void {
    if (!isBrowser()) return;
    const el =
      typeof target === 'string'
        ? document.getElementById(target.replace(/^#/, ''))
        : typeof target === 'number'
          ? null
          : target;
    const offset = options.offset ?? 0;

    if (this.lenis) {
      this.lenis.scrollTo(el ?? (typeof target === 'number' ? target : 0), {
        offset,
        duration: options.duration ?? 1.8,
        easing: easeInOutExpo,
        immediate: options.immediate ?? false,
        force: true,
      });
      return;
    }

    const top = el ? el.getBoundingClientRect().top + window.scrollY + offset : Number(target);
    window.scrollTo({ top, behavior: 'auto' });
  }

  /** Lock scrolling; every `stop()` must be balanced by a `start()`. */
  stop(): void {
    this.locks++;
    this.applyLock();
  }

  start(): void {
    this.locks = Math.max(0, this.locks - 1);
    this.applyLock();
  }

  private applyLock(): void {
    if (!isBrowser()) return;
    const locked = this.locks > 0;
    if (this.lenis) {
      if (locked) this.lenis.stop();
      else this.lenis.start();
    }
    document.documentElement.style.overflow = locked && !this.lenis ? 'hidden' : '';
  }

  private measureViewport(): void {
    this.vh = window.innerHeight || 800;
    this.vw = window.innerWidth || 1200;
  }

  private measureSections(): void {
    this.sectionTops = [...this.sections.entries()]
      .map(([id, el]) => ({ id, top: absoluteTop(el) }))
      .sort((a, b) => a.top - b.top);
  }

  private updateActiveSection(): void {
    const probe = this.y + this.vh * 0.45;
    let active = 'top';
    for (const s of this.sectionTops) {
      if (s.top <= probe) active = s.id;
    }
    if (active !== this.activeSection()) {
      this.activeSection.set(active);
    }
  }
}
