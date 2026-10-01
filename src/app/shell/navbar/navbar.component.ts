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
import { ThemeService } from '../../core/theme.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { TickerService } from '../../core/ticker.service';
import { IntroService } from '../../core/intro.service';
import { LocalTimeService } from '../../core/local-time.service';
import { ScrambleDirective } from '../../core/scramble.directive';
import { SECTIONS, SITE } from '../../core/site.config';

@Component({
  selector: 'app-navbar',
  imports: [ScrambleDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class NavbarComponent implements OnDestroy {
  protected readonly theme = inject(ThemeService);
  protected readonly scroll = inject(SmoothScrollService);
  protected readonly intro = inject(IntroService);
  protected readonly clock = inject(LocalTimeService);
  private readonly ticker = inject(TickerService);

  protected readonly site = SITE;
  protected readonly sections = SECTIONS;
  protected readonly hidden = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  private readonly progressRef = viewChild<ElementRef<HTMLElement>>('progress');
  private removeTick: (() => void) | null = null;
  private removePeek: (() => void) | null = null;
  private lastY = 0;
  /** Pointer resting near the top edge — reveal the bar even mid-scroll. */
  private peeking = false;

  constructor() {
    afterNextRender(() => {
      this.removeTick = this.ticker.add(() => this.frame(), 30);
      const onMove = (e: PointerEvent): void => {
        if (e.pointerType === 'mouse') this.peeking = e.clientY < 88;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      this.removePeek = () => window.removeEventListener('pointermove', onMove);
    });
  }

  ngOnDestroy(): void {
    this.removeTick?.();
    this.removePeek?.();
  }

  protected go(event: Event, id: string): void {
    event.preventDefault();
    const wasOpen = this.menuOpen();
    this.closeMenu();
    // Let the menu start closing before the long scroll begins.
    setTimeout(() => this.scroll.scrollTo(id, { offset: id === 'top' ? 0 : -8 }), wasOpen ? 260 : 0);
  }

  protected toggleTheme(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    this.theme.toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    } else {
      this.menuOpen.set(true);
      this.scroll.stop();
    }
  }

  protected closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.scroll.start();
  }

  private frame(): void {
    const y = this.scroll.y;
    const delta = y - this.lastY;
    this.lastY = y;

    const scrolled = y > 40;
    if (scrolled !== this.scrolled()) this.scrolled.set(scrolled);

    if (!this.menuOpen()) {
      if ((y < 160 || this.peeking) && this.hidden()) this.hidden.set(false);
      else if (delta > 4 && y > 160 && !this.peeking && !this.hidden()) this.hidden.set(true);
      else if (delta < -6 && this.hidden()) this.hidden.set(false);
    }

    const bar = this.progressRef()?.nativeElement;
    if (bar) {
      const p = Math.min(1, Math.max(0, y / Math.max(1, this.scroll.limit)));
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    }
  }
}
