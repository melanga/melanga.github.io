import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  booleanAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { animate, inView, type AnimationPlaybackControls } from 'motion';
import { ENTRANCE_SPRING, prefersReducedMotion, resolveTransition } from './motion.config';

export type SpringAnimationType =
  | 'fade-up'
  | 'fade-up-slight'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'fade-in';

const INITIAL_STATES: Record<SpringAnimationType, Record<string, number>> = {
  'fade-up': { opacity: 0, y: 40 },
  'fade-up-slight': { opacity: 0, y: 20 },
  'slide-left': { opacity: 0, x: -60 },
  'slide-right': { opacity: 0, x: 60 },
  'scale-in': { opacity: 0, scale: 0.92 },
  'fade-in': { opacity: 0 },
};

@Directive({
  selector: '[appSpringAnimate]',
})
export class SpringAnimateDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  readonly springAnimation = input<SpringAnimationType>('fade-up', {
    alias: 'springAnimation',
  });
  readonly springDelay = input(0, { alias: 'springDelay' });
  readonly springImmediate = input(false, {
    alias: 'springImmediate',
    transform: booleanAttribute,
  });

  private stopInView: (() => void) | null = null;
  private animation: AnimationPlaybackControls | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const element = this.el.nativeElement;
    const type = this.springAnimation();
    const initial = INITIAL_STATES[type];

    Object.assign(element.style, {
      opacity: String(initial['opacity'] ?? 1),
      transform: this.buildTransform(initial),
    });

    if (this.springImmediate() || typeof IntersectionObserver === 'undefined') {
      this.runAnimation();
      return;
    }

    this.stopInView = inView(
      element,
      () => {
        this.runAnimation();
        return () => this.animation?.stop();
      },
      { amount: 0.05 },
    );
  }

  ngOnDestroy(): void {
    this.stopInView?.();
    this.animation?.stop();
  }

  private runAnimation(): void {
    const element = this.el.nativeElement;
    this.animation?.stop();
    this.animation = animate(
      element,
      { opacity: 1, x: 0, y: 0, scale: 1 },
      {
        ...resolveTransition(ENTRANCE_SPRING),
        delay: prefersReducedMotion() ? 0 : this.springDelay() / 1000,
      },
    );
  }

  private buildTransform(state: Record<string, number>): string {
    const parts: string[] = [];
    if (state['x'] !== undefined) parts.push(`translateX(${state['x']}px)`);
    if (state['y'] !== undefined) parts.push(`translateY(${state['y']}px)`);
    if (state['scale'] !== undefined) parts.push(`scale(${state['scale']})`);
    return parts.length ? parts.join(' ') : 'none';
  }
}
