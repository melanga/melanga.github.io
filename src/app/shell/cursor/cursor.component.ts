import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { TickerService } from '../../core/ticker.service';
import { damp } from '../../core/motion.config';

const TARGET_SELECTOR = 'a, button, [data-cursor], [role="button"]';
const IDLE_SIZE = 26;
const PAD = 7;
const CORNER = 9;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Stable pseudo-confidence per label, so the same element always reports the same score. */
function confidenceFor(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (0.91 + ((h >>> 0) % 89) / 1000).toFixed(2);
}

function labelFor(el: HTMLElement): string {
  const explicit = el.dataset['cursor'];
  if (explicit) return explicit;
  if (el.tagName === 'A') {
    const href = el.getAttribute('href') ?? '';
    if (href.startsWith('mailto:')) return 'email';
    if (/^https?:/.test(href)) return 'external';
    return 'link';
  }
  return 'button';
}

/**
 * A computer-vision reticle. It idles as a small crosshair and snaps into a
 * bounding box — with a class label and confidence score — around whatever
 * interactive element it hovers.
 */
@Component({
  selector: 'app-cursor',
  template: `
    <div class="cur" #root aria-hidden="true">
      <span class="cur__c cur__c--tl" #tl></span>
      <span class="cur__c cur__c--tr" #tr></span>
      <span class="cur__c cur__c--bl" #bl></span>
      <span class="cur__c cur__c--br" #br></span>
      <span class="cur__label" #label></span>
      <span class="cur__dot" #dot></span>
    </div>
  `,
  styles: `
    .cur {
      position: fixed;
      inset: 0;
      z-index: 200;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.35s var(--ease-out);
    }
    .cur.is-visible {
      opacity: 1;
    }
    .cur__c,
    .cur__dot,
    .cur__label {
      position: absolute;
      top: 0;
      left: 0;
      will-change: transform;
    }
    .cur__c {
      width: ${CORNER}px;
      height: ${CORNER}px;
      border: 0 solid var(--fg);
      transition: border-color 0.3s ease;
    }
    .cur__c--tl {
      border-top-width: 1.5px;
      border-left-width: 1.5px;
    }
    .cur__c--tr {
      border-top-width: 1.5px;
      border-right-width: 1.5px;
    }
    .cur__c--bl {
      border-bottom-width: 1.5px;
      border-left-width: 1.5px;
    }
    .cur__c--br {
      border-bottom-width: 1.5px;
      border-right-width: 1.5px;
    }
    .cur.is-target .cur__c {
      border-color: var(--accent);
    }
    .cur__dot {
      width: 4px;
      height: 4px;
      margin: -2px 0 0 -2px;
      border-radius: 50%;
      background: var(--accent);
    }
    .cur__label {
      padding: 2px 5px;
      font-family: var(--font-mono);
      font-size: 10px;
      line-height: 1.3;
      letter-spacing: 0.04em;
      white-space: nowrap;
      color: var(--on-accent);
      background: var(--accent);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .cur.is-target .cur__label {
      opacity: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursorComponent implements OnDestroy {
  private readonly ticker = inject(TickerService);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly tl = viewChild.required<ElementRef<HTMLElement>>('tl');
  private readonly tr = viewChild.required<ElementRef<HTMLElement>>('tr');
  private readonly bl = viewChild.required<ElementRef<HTMLElement>>('bl');
  private readonly br = viewChild.required<ElementRef<HTMLElement>>('br');
  private readonly labelRef = viewChild.required<ElementRef<HTMLElement>>('label');
  private readonly dotRef = viewChild.required<ElementRef<HTMLElement>>('dot');

  private mouse = { x: -100, y: -100 };
  private dot = { x: -100, y: -100 };
  private box: Box = { x: -100, y: -100, w: IDLE_SIZE, h: IDLE_SIZE };
  private target: HTMLElement | null = null;
  private pressed = false;
  private visible = false;
  private teardown: (() => void)[] = [];

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    for (const fn of this.teardown) fn();
    document.documentElement.classList.remove('has-cursor');
  }

  private init(): void {
    document.documentElement.classList.add('has-cursor');
    const root = this.root().nativeElement;

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.visible) {
        this.visible = true;
        this.dot.x = e.clientX;
        this.dot.y = e.clientY;
        this.box.x = e.clientX - IDLE_SIZE / 2;
        this.box.y = e.clientY - IDLE_SIZE / 2;
        root.classList.add('is-visible');
      }
    };
    const onOver = (e: PointerEvent): void => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGET_SELECTOR) ?? null;
      if (el === this.target) return;
      this.target = el;
      root.classList.toggle('is-target', !!el);
      if (el) {
        const label = labelFor(el);
        this.labelRef().nativeElement.textContent = `${label} ${confidenceFor(label + (el.textContent ?? ''))}`;
      }
    };
    const onLeave = (): void => {
      this.visible = false;
      root.classList.remove('is-visible');
    };
    const onDown = (): void => {
      this.pressed = true;
    };
    const onUp = (): void => {
      this.pressed = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    this.teardown.push(() => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    });
    this.teardown.push(this.ticker.add((_, dt) => this.frame(dt), 50));
  }

  private frame(dt: number): void {
    if (!this.visible) return;
    if (this.target && !this.target.isConnected) {
      this.target = null;
      this.root().nativeElement.classList.remove('is-target');
    }

    let goal: Box;
    if (this.target) {
      const r = this.target.getBoundingClientRect();
      goal = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
    } else {
      const s = this.pressed ? IDLE_SIZE * 0.7 : IDLE_SIZE;
      goal = { x: this.mouse.x - s / 2, y: this.mouse.y - s / 2, w: s, h: s };
    }

    const k = damp(this.target ? 0.2 : 0.28, dt);
    this.box.x += (goal.x - this.box.x) * k;
    this.box.y += (goal.y - this.box.y) * k;
    this.box.w += (goal.w - this.box.w) * k;
    this.box.h += (goal.h - this.box.h) * k;

    const kd = damp(0.5, dt);
    this.dot.x += (this.mouse.x - this.dot.x) * kd;
    this.dot.y += (this.mouse.y - this.dot.y) * kd;

    const { x, y, w, h } = this.box;
    const inset = this.pressed && this.target ? 3 : 0;
    this.place(this.tl(), x + inset, y + inset);
    this.place(this.tr(), x + w - CORNER - inset, y + inset);
    this.place(this.bl(), x + inset, y + h - CORNER - inset);
    this.place(this.br(), x + w - CORNER - inset, y + h - CORNER - inset);
    this.place(this.labelRef(), x, y - 19);
    this.place(this.dotRef(), this.dot.x, this.dot.y);
  }

  private place(ref: ElementRef<HTMLElement>, x: number, y: number): void {
    ref.nativeElement.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
}
