import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { inView } from 'motion';
import { RevealDirective } from '../../core/reveal.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SectionHeadComponent } from '../../shared/section-head/section-head.component';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { TickerService } from '../../core/ticker.service';
import { PortfolioDataStore } from '../../core/portfolio-data.store';
import { hasFinePointer, prefersReducedMotion } from '../../core/motion.config';
import { SITE } from '../../core/site.config';

interface Detection {
  readonly label: string;
  readonly score: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly tone: 'accent' | 'fg' | 'muted';
  /** Hang the label from the box's right edge (boxes near the frame's right side). */
  readonly alignEnd?: boolean;
}

/** Bounding boxes over the photo, in % of the frame. */
const DETECTIONS: readonly Detection[] = [
  { label: 'person', score: '0.99', x: 25, y: 13, w: 55, h: 87, tone: 'fg' },
  { label: 'face · melanga', score: '0.98', x: 55, y: 20, w: 19, h: 37, tone: 'accent' },
  { label: 'cloud', score: '0.91', x: 3, y: 8, w: 30, h: 22, tone: 'muted' },
  { label: 'valley', score: '0.87', x: 81, y: 56, w: 17, h: 32, tone: 'muted', alignEnd: true },
];

@Component({
  selector: 'app-about',
  imports: [RevealDirective, TrackSectionDirective, SectionHeadComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnDestroy {
  private readonly scroll = inject(SmoothScrollService);
  private readonly ticker = inject(TickerService);
  private readonly store = inject(PortfolioDataStore);

  protected readonly site = SITE;
  protected readonly detections = DETECTIONS;
  protected readonly scanned = signal(false);

  protected readonly projectCount = computed(() => this.store.projects().length);
  protected readonly techCount = computed(() => this.store.technologies().length);
  protected readonly live = computed(() => this.store.source() === 'github');

  private readonly statementRef = viewChild.required<ElementRef<HTMLElement>>('statement');
  private readonly figureRef = viewChild.required<ElementRef<HTMLElement>>('figure');
  private readonly photoRef = viewChild.required<ElementRef<HTMLElement>>('photo');

  private words: HTMLElement[] = [];
  private wordLevels: number[] = [];
  private teardown: (() => void)[] = [];
  /** The photo parallax is a per-frame transform, which trails native touch scrolling. */
  private parallax = false;

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    for (const fn of this.teardown) fn();
  }

  private init(): void {
    const figure = this.figureRef().nativeElement;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      this.scanned.set(true);
      return;
    }

    this.teardown.push(inView(figure, () => this.scanned.set(true), { amount: 0.35 }));
    this.parallax = hasFinePointer();
    this.splitStatement();
    this.teardown.push(this.ticker.add(() => this.frame(), 40));
  }

  /** Wrap each word of the statement so it can come into focus as you read. */
  private splitStatement(): void {
    const root = this.statementRef().nativeElement;
    const walk = (node: Node): void => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = (child.textContent ?? '').split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
            } else {
              const span = document.createElement('span');
              span.className = 'sw';
              span.textContent = part;
              frag.appendChild(span);
              this.words.push(span);
            }
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      }
    };
    walk(root);
    this.wordLevels = this.words.map(() => -1);
    root.classList.add('is-split');
  }

  private frame(): void {
    const vh = this.scroll.vh;

    // Statement: words resolve from noise into focus as the paragraph crosses the viewport.
    const st = this.statementRef().nativeElement.getBoundingClientRect();
    if (st.bottom > -50 && st.top < vh + 50) {
      const start = vh * 0.88;
      const end = vh * 0.45;
      const p = (start - st.top) / (start - end + st.height * 0.35);
      const lit = Math.max(0, Math.min(1, p)) * (this.words.length + 4);
      for (let i = 0; i < this.words.length; i++) {
        const level = Math.round(Math.max(0, Math.min(1, (lit - i) / 4)) * 20) / 20;
        if (level !== this.wordLevels[i]) {
          this.wordLevels[i] = level;
          this.words[i].style.setProperty('--focus', String(level));
        }
      }
    }

    // Photo: slow inner parallax.
    if (!this.parallax) return;
    const fig = this.figureRef().nativeElement.getBoundingClientRect();
    if (fig.bottom > 0 && fig.top < vh) {
      const centre = (fig.top + fig.height / 2 - vh / 2) / vh;
      this.photoRef().nativeElement.style.transform = `translate3d(0, ${(centre * -6).toFixed(2)}%, 0) scale(1.14)`;
    }
  }
}
