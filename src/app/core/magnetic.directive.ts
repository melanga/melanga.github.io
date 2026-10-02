import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { TickerService } from './ticker.service';
import { damp, hasFinePointer, prefersReducedMotion } from './motion.config';

/** Pulls an element toward the pointer while hovered, then springs it home. */
@Directive({
  selector: '[appMagnetic]',
})
export class MagneticDirective implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly ticker = inject(TickerService);

  /** Fraction of the pointer offset the element follows (bare attribute = default). */
  readonly appMagnetic = input<number, number | string>(0.32, {
    transform: (v: number | string) => (typeof v === 'number' ? v : v === '' ? 0.32 : Number(v) || 0.32),
  });

  private tx = 0;
  private ty = 0;
  private x = 0;
  private y = 0;
  private removeTick: (() => void) | null = null;
  private teardown: (() => void) | null = null;

  ngOnInit(): void {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const el = this.host.nativeElement;

    const onMove = (e: PointerEvent): void => {
      const r = el.getBoundingClientRect();
      const strength = this.appMagnetic();
      this.tx = (e.clientX - (r.left + r.width / 2)) * strength;
      this.ty = (e.clientY - (r.top + r.height / 2)) * strength;
      this.wake();
    };
    const onLeave = (): void => {
      this.tx = 0;
      this.ty = 0;
      this.wake();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    this.teardown = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }

  ngOnDestroy(): void {
    this.teardown?.();
    this.removeTick?.();
  }

  private wake(): void {
    if (this.removeTick) return;
    this.removeTick = this.ticker.add((_, dt) => {
      const k = damp(0.14, dt);
      this.x += (this.tx - this.x) * k;
      this.y += (this.ty - this.y) * k;
      this.host.nativeElement.style.transform = `translate3d(${this.x.toFixed(2)}px, ${this.y.toFixed(2)}px, 0)`;
      if (Math.abs(this.tx - this.x) < 0.05 && Math.abs(this.ty - this.y) < 0.05 && !this.tx && !this.ty) {
        this.host.nativeElement.style.transform = '';
        this.removeTick?.();
        this.removeTick = null;
      }
    });
  }
}
