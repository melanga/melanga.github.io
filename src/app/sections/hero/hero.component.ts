import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';
import { ScrambleDirective } from '../../core/scramble.directive';
import { MagneticDirective } from '../../core/magnetic.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { TickerService } from '../../core/ticker.service';
import { IntroService } from '../../core/intro.service';
import { LocalTimeService } from '../../core/local-time.service';
import { scrambleText } from '../../core/scramble';
import { prefersReducedMotion } from '../../core/motion.config';
import { SITE } from '../../core/site.config';

const ROLE_INTERVAL_MS = 3400;

@Component({
  selector: 'app-hero',
  imports: [RevealDirective, ScrambleDirective, MagneticDirective, TrackSectionDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements OnDestroy {
  private readonly scroll = inject(SmoothScrollService);
  private readonly ticker = inject(TickerService);
  private readonly intro = inject(IntroService);
  protected readonly clock = inject(LocalTimeService);
  protected readonly site = SITE;

  private readonly innerRef = viewChild.required<ElementRef<HTMLElement>>('inner');
  private readonly roleRef = viewChild.required<ElementRef<HTMLElement>>('role');

  private removeTick: (() => void) | null = null;
  private roleTimer: ReturnType<typeof setInterval> | null = null;
  private cancelScramble: (() => void) | null = null;
  private roleIndex = 0;

  constructor() {
    afterNextRender(() => {
      if (!prefersReducedMotion()) {
        this.removeTick = this.ticker.add(() => this.parallax(), 40);
      }
    });

    effect(() => {
      if (this.intro.revealed()) untracked(() => this.startRoles());
    });
  }

  ngOnDestroy(): void {
    this.removeTick?.();
    this.cancelScramble?.();
    if (this.roleTimer) clearInterval(this.roleTimer);
  }

  protected go(event: Event, id: string): void {
    event.preventDefault();
    this.scroll.scrollTo(id, { offset: -8 });
  }

  private startRoles(): void {
    if (this.roleTimer || typeof window === 'undefined') return;
    this.roleTimer = setInterval(() => {
      this.roleIndex = (this.roleIndex + 1) % SITE.roles.length;
      this.cancelScramble?.();
      this.cancelScramble = scrambleText(this.roleRef().nativeElement, SITE.roles[this.roleIndex], {
        duration: 700,
      });
    }, ROLE_INTERVAL_MS);
  }

  /** The hero drifts up slower than the page and dissolves as you leave it. */
  private parallax(): void {
    const y = this.scroll.y;
    const vh = this.scroll.vh;
    if (y > vh * 1.2) return;
    const p = Math.min(1, y / (vh * 0.85));
    const el = this.innerRef().nativeElement;
    el.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`;
    el.style.opacity = (1 - p * 0.95).toFixed(3);
  }
}
