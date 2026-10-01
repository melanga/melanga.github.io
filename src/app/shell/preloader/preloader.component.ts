import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { IntroService } from '../../core/intro.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { TickerService } from '../../core/ticker.service';

const EPOCHS = 12;
const FIRST_VISIT_MS = 2700;
const REPEAT_VISIT_MS = 1100;
const MAX_BOOT_WAIT_MS = 1800;

/** Training loss: steep early drop, settling noise. Deterministic so it looks the same every time. */
function lossAt(p: number): number {
  const wobble = Math.sin(p * 53) * 0.07 + Math.sin(p * 131) * 0.035;
  return 2.31 * Math.exp(-4.4 * p) + 0.029 + wobble * Math.exp(-2.6 * p);
}

function accuracyAt(p: number): number {
  return 0.1 + 0.884 * (1 - Math.exp(-4.3 * p));
}

/**
 * The opening "training run". While the particle field converges from noise into
 * a portrait, this HUD reports epochs, loss and accuracy — then steps aside.
 */
@Component({
  selector: 'app-preloader',
  template: `
    @if (mounted()) {
      <div class="pl" [class.is-leaving]="leaving()" [class.is-quiet]="quiet" aria-hidden="true">
        <div class="pl__panel">
          <div class="pl__row">
            <span class="label pl__status"
              ><span class="dot dot--live"></span><span #status>initialising weights</span></span
            >
            <span class="label">melanga-v1</span>
          </div>
          <p class="pl__cmd mono">
            model.fit(<span class="accent">experience</span>, epochs={{ epochs }})
          </p>
          <svg class="pl__curve" viewBox="0 0 300 64" preserveAspectRatio="none">
            <line x1="0" y1="63.5" x2="300" y2="63.5" class="pl__axis" />
            <path #curve d="M0 64" class="pl__loss" />
          </svg>
          <dl class="pl__metrics">
            <div>
              <dt class="label">epoch</dt>
              <dd #epoch class="mono">00/{{ epochs }}</dd>
            </div>
            <div>
              <dt class="label">loss</dt>
              <dd #loss class="mono">—</dd>
            </div>
            <div>
              <dt class="label">accuracy</dt>
              <dd #acc class="mono">—</dd>
            </div>
          </dl>
          <div class="pl__bar"><span #bar></span></div>
        </div>
      </div>
    }
  `,
  styles: `
    .pl {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: flex;
      align-items: flex-end;
      padding: var(--gutter);
      pointer-events: none;
      transition: opacity 0.9s var(--ease-out), transform 1.1s var(--ease-out);
    }
    .pl.is-quiet .pl__panel {
      display: none;
    }
    .pl.is-leaving {
      opacity: 0;
      transform: translateY(-24px);
    }
    .pl__panel {
      width: min(100%, 380px);
      padding: 1.25rem 1.25rem 1.1rem;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--bg) 72%, transparent);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      animation: pl-in 0.9s var(--ease-out) both;
    }
    @keyframes pl-in {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
    }
    .pl__row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .pl__status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--fg);
    }
    .pl__cmd {
      margin-top: 0.9rem;
      font-size: 0.8125rem;
      color: var(--fg-muted);
    }
    .pl__curve {
      width: 100%;
      height: 64px;
      margin-top: 1rem;
      overflow: visible;
    }
    .pl__axis {
      stroke: var(--line-strong);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }
    .pl__loss {
      fill: none;
      stroke: var(--accent);
      stroke-width: 1.5;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    .pl__metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.9rem;
    }
    .pl__metrics dd {
      margin: 0.2rem 0 0;
      font-size: 0.9375rem;
      color: var(--fg);
      font-variant-numeric: tabular-nums;
    }
    .pl__bar {
      height: 2px;
      margin-top: 1rem;
      background: var(--line);
      overflow: hidden;
      border-radius: 2px;
    }
    .pl__bar span {
      display: block;
      height: 100%;
      background: var(--fg);
      transform-origin: left center;
      transform: scaleX(0);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloaderComponent implements OnDestroy {
  private readonly intro = inject(IntroService);
  private readonly scroll = inject(SmoothScrollService);
  private readonly ticker = inject(TickerService);

  private readonly statusRef = viewChild<ElementRef<HTMLElement>>('status');
  private readonly curveRef = viewChild<ElementRef<SVGPathElement>>('curve');
  private readonly epochRef = viewChild<ElementRef<HTMLElement>>('epoch');
  private readonly lossRef = viewChild<ElementRef<HTMLElement>>('loss');
  private readonly accRef = viewChild<ElementRef<HTMLElement>>('acc');
  private readonly barRef = viewChild<ElementRef<HTMLElement>>('bar');

  protected readonly epochs = EPOCHS;
  protected readonly mounted = signal(!this.intro.skip);
  protected readonly leaving = signal(false);
  protected readonly quiet = !this.intro.firstVisit;

  private removeTick: (() => void) | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private fontsReady = false;
  private bootStart = 0;
  private lastEpoch = -1;
  private lastStatus = '';

  constructor() {
    afterNextRender(() => {
      if (this.intro.skip) return;
      this.scroll.stop();
      this.bootStart = performance.now();
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fonts?.ready) {
        fonts.ready.then(() => (this.fontsReady = true)).catch(() => (this.fontsReady = true));
      } else {
        this.fontsReady = true;
      }
      this.removeTick = this.ticker.add((now) => this.tick(now), 20);
    });
  }

  ngOnDestroy(): void {
    this.removeTick?.();
    for (const t of this.timers) clearTimeout(t);
  }

  private tick(now: number): void {
    const phase = this.intro.phase();

    if (phase === 'booting') {
      const waited = now - this.bootStart;
      const ready = this.intro.fieldReady() && this.fontsReady;
      if (ready || waited > MAX_BOOT_WAIT_MS) {
        this.intro.beginTraining(this.quiet ? REPEAT_VISIT_MS : FIRST_VISIT_MS);
      }
      return;
    }

    if (phase !== 'training') return;
    const p = this.intro.trainingProgress(now);
    this.render(p);
    if (p >= 1) this.complete();
  }

  private render(p: number): void {
    if (this.quiet) return;
    const epoch = Math.min(EPOCHS, 1 + Math.floor(p * EPOCHS));
    if (epoch !== this.lastEpoch) {
      this.lastEpoch = epoch;
      this.setText(this.epochRef(), `${String(epoch).padStart(2, '0')}/${EPOCHS}`);
    }
    this.setText(this.lossRef(), lossAt(p).toFixed(4));
    this.setText(this.accRef(), `${(accuracyAt(p) * 100).toFixed(1)}%`);
    this.setStatus(p < 0.12 ? 'warming up' : p < 0.72 ? 'training' : p < 1 ? 'converging' : 'converged');

    const bar = this.barRef()?.nativeElement;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

    const curve = this.curveRef()?.nativeElement;
    if (curve) {
      const steps = Math.max(2, Math.round(p * 90));
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const q = (i / steps) * p;
        const x = q * 300;
        const y = 64 - Math.min(1, lossAt(q) / 2.4) * 60;
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      curve.setAttribute('d', d);
    }
  }

  private complete(): void {
    this.removeTick?.();
    this.removeTick = null;
    this.timers.push(
      setTimeout(
        () => {
          this.leaving.set(true);
          this.intro.reveal();
          this.scroll.start();
        },
        this.quiet ? 0 : 320,
      ),
      setTimeout(() => this.mounted.set(false), 1500),
      setTimeout(() => this.intro.finish(), 1900),
    );
  }

  private setStatus(text: string): void {
    if (text === this.lastStatus) return;
    this.lastStatus = text;
    this.setText(this.statusRef(), text);
  }

  private setText(ref: ElementRef<HTMLElement> | undefined, text: string): void {
    if (ref) ref.nativeElement.textContent = text;
  }
}
