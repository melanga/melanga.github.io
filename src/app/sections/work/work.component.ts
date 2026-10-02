import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RevealDirective } from '../../core/reveal.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SectionHeadComponent } from '../../shared/section-head/section-head.component';
import { PortfolioDataStore } from '../../core/portfolio-data.store';
import { ProjectFilterService } from '../../core/project-filter.service';
import { ProjectDetailService } from '../../core/project-detail.service';
import { TickerService } from '../../core/ticker.service';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { FALLBACK_PORTFOLIO_DATA } from '../../core/portfolio-fallback.data';
import { PROJECT_OVERRIDES } from '../../core/portfolio-overrides.data';
import { projectCover, projectImage } from '../../core/project-media';
import { langColor } from '../../core/tech-domains';
import { damp, hasFinePointer, prefersReducedMotion } from '../../core/motion.config';
import type { PortfolioProject } from '../../core/portfolio.models';

export const PROJECTS_PAGE_SIZE = 8;

interface Featured {
  readonly project: PortfolioProject;
  readonly image: string;
}

@Component({
  selector: 'app-work',
  imports: [DatePipe, RevealDirective, TrackSectionDirective, SectionHeadComponent],
  templateUrl: './work.component.html',
  styleUrl: './work.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkComponent implements OnDestroy {
  protected readonly store = inject(PortfolioDataStore);
  protected readonly filter = inject(ProjectFilterService);
  private readonly detail = inject(ProjectDetailService);
  private readonly ticker = inject(TickerService);
  private readonly scroll = inject(SmoothScrollService);

  private readonly previewRef = viewChild.required<ElementRef<HTMLElement>>('preview');
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('card');
  private readonly shades = viewChildren<ElementRef<HTMLElement>>('shade');

  /** Featured case studies: projects flagged in the overrides that have a screenshot. */
  protected readonly featured = computed((): Featured[] => {
    const pick = (list: readonly PortfolioProject[]): Featured[] =>
      list
        .filter((p) => PROJECT_OVERRIDES[p.name]?.featured && projectImage(p))
        .map((p) => ({ project: p, image: projectImage(p)! }));
    const live = pick(this.store.projects());
    return live.length ? live : pick(FALLBACK_PORTFOLIO_DATA.projects);
  });

  protected readonly filtered = this.filter.filteredProjects;
  private readonly visibleCount = signal(PROJECTS_PAGE_SIZE);
  protected readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));
  protected readonly remaining = computed(() => Math.max(0, this.filtered().length - this.visibleCount()));

  protected readonly previewSrc = signal<string | null>(null);
  protected readonly previewOn = signal(false);

  private pointer = { x: 0, y: 0 };
  private preview = { x: 0, y: 0, vx: 0, rot: 0, scale: 0 };
  private teardown: (() => void)[] = [];
  private finePointer = false;

  constructor() {
    effect(() => {
      this.filter.selectedTag();
      untracked(() => this.visibleCount.set(PROJECTS_PAGE_SIZE));
    });

    afterNextRender(() => {
      this.finePointer = hasFinePointer() && !prefersReducedMotion();
      const onMove = (e: PointerEvent): void => {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      this.teardown.push(() => window.removeEventListener('pointermove', onMove));
      if (!prefersReducedMotion()) {
        this.teardown.push(this.ticker.add((_, dt) => this.frame(dt), 40));
      }
    });
  }

  ngOnDestroy(): void {
    for (const fn of this.teardown) fn();
  }

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected color(lang: string | null): string {
    return langColor(lang);
  }

  protected open(project: PortfolioProject, event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.previewOn.set(false);
    this.detail.open(project, rect);
  }

  protected loadMore(): void {
    this.visibleCount.update((n) => n + PROJECTS_PAGE_SIZE);
  }

  protected showPreview(project: PortfolioProject): void {
    if (!this.finePointer) return;
    this.previewSrc.set(projectCover(project));
    if (!this.previewOn()) {
      this.preview.x = this.pointer.x + 160;
      this.preview.y = this.pointer.y;
    }
    this.previewOn.set(true);
  }

  protected hidePreview(): void {
    this.previewOn.set(false);
  }

  private frame(dt: number): void {
    this.stackCards();
    this.movePreview(dt);
  }

  /** Sticky case studies: each card recedes as the next one slides over it. */
  private stackCards(): void {
    const cards = this.cards();
    const shades = this.shades();
    const vh = this.scroll.vh;
    // Cards only stack (position: sticky) above the mobile breakpoint.
    if (this.scroll.vw <= 760) return;
    for (let i = 0; i < cards.length - 1; i++) {
      const card = cards[i].nativeElement;
      const next = cards[i + 1].nativeElement.getBoundingClientRect();
      const own = card.getBoundingClientRect();
      if (own.bottom < -vh || own.top > vh * 2) continue;
      const p = Math.max(0, Math.min(1, 1 - (next.top - own.top) / (vh * 0.85)));
      card.style.transform = `scale(${(1 - p * 0.07).toFixed(4)})`;
      const shade = shades[i]?.nativeElement;
      if (shade) shade.style.opacity = (p * 0.55).toFixed(3);
    }
  }

  /** The hover preview trails the cursor and leans into its motion. */
  private movePreview(dt: number): void {
    const el = this.previewRef().nativeElement;
    const target = this.previewOn() ? 1 : 0;
    const p = this.preview;
    if (target === 0 && p.scale < 0.001) {
      if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = 'visible';
    // Sit beside the cursor (flipping near the right edge) so the row stays readable.
    const width = el.offsetWidth || 300;
    const flip = this.pointer.x + width + 64 > this.scroll.vw;
    const goalX = this.pointer.x + (flip ? -(width / 2 + 40) : width / 2 + 40);
    const k = damp(0.16, dt);
    const nx = p.x + (goalX - p.x) * k;
    p.vx = nx - p.x;
    p.x = nx;
    p.y += (this.pointer.y - p.y) * k;
    p.rot += (Math.max(-12, Math.min(12, p.vx * 0.6)) - p.rot) * damp(0.12, dt);
    p.scale += (target - p.scale) * damp(0.14, dt);
    el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${p.rot.toFixed(2)}deg) scale(${p.scale.toFixed(3)})`;
  }
}
