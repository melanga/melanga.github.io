import {
  Directive,
  AfterViewInit,
  OnDestroy,
  inject,
  input,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AnimationType =
  | 'fade-up'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'fade-up-slight';

@Directive({ selector: '[appScrollAnimate]' })
export class ScrollAnimateDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  readonly animation = input<AnimationType>('fade-up');
  readonly animationDelay = input<string>('0ms');
  readonly threshold = input<number>(0.15);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeEl = this.el.nativeElement as HTMLElement;
    nativeEl.classList.add('scroll-animate', `animate-${this.animation()}`);
    nativeEl.style.setProperty('--animate-delay', this.animationDelay());

    if (typeof IntersectionObserver === 'undefined') {
      nativeEl.classList.add('animate-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          nativeEl.classList.add('animate-visible');
          this.observer?.unobserve(nativeEl);
        }
      },
      { threshold: this.threshold() },
    );
    this.observer.observe(nativeEl);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
