import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { animate, type AnimationPlaybackControls } from 'motion';
import { ProjectDetailService } from '../core/project-detail.service';
import { SmoothScrollService } from '../core/smooth-scroll.service';
import { POPUP_SPRING, isBrowser, resolveTransition } from '../core/motion.config';
import { projectCover, projectImage } from '../core/project-media';
import { langColor } from '../core/tech-domains';

interface PanelLayout {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Expands a project from wherever it was clicked into a full case panel (FLIP). */
@Component({
  selector: 'app-project-detail-overlay',
  imports: [DatePipe],
  templateUrl: './project-detail-overlay.component.html',
  styleUrl: './project-detail-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class ProjectDetailOverlayComponent implements OnDestroy {
  protected readonly detailService = inject(ProjectDetailService);
  private readonly scroll = inject(SmoothScrollService);
  private readonly injector = inject(Injector);

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly backdropRef = viewChild<ElementRef<HTMLElement>>('backdrop');

  protected readonly visible = signal(false);
  protected readonly contentVisible = signal(false);
  protected readonly layout = signal<PanelLayout | null>(null);

  protected readonly project = computed(() => this.detailService.selected()?.project ?? null);
  protected readonly cover = computed(() => {
    const p = this.project();
    return p ? projectCover(p) : null;
  });
  protected readonly isScreenshot = computed(() => {
    const p = this.project();
    return !!p && !!projectImage(p);
  });
  protected readonly languages = computed(() => {
    const p = this.project();
    if (!p) return [];
    return [...p.languageBreakdown.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, pct]) => ({ name, pct, color: langColor(name) }));
  });

  private panelAnimation: AnimationPlaybackControls | null = null;
  private backdropAnimation: AnimationPlaybackControls | null = null;
  private origin: DOMRect | null = null;
  private previousFocus: HTMLElement | null = null;
  private contentTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const selection = this.detailService.selected();
      untracked(() => {
        if (selection && isBrowser()) {
          this.origin = selection.originRect;
          this.openOverlay(selection.originRect);
        } else if (!selection && this.visible()) {
          this.animateClose();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.clearContentTimer();
    this.panelAnimation?.stop();
    this.backdropAnimation?.stop();
    if (this.visible()) this.scroll.start();
    this.detailService.setOverlayOpen(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key === 'Tab') this.trapFocus(event);
  }

  protected close(): void {
    this.detailService.close();
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private openOverlay(originRect: DOMRect): void {
    // Reopened while the last panel was still closing: it already holds the
    // scroll lock and the focus to return to, and its close must not finish.
    const reopening = this.visible();
    this.panelAnimation?.stop();
    this.backdropAnimation?.stop();
    this.clearContentTimer();
    if (!reopening) this.previousFocus = document.activeElement as HTMLElement | null;
    this.contentVisible.set(false);
    this.detailService.setOverlayOpen(true);
    this.layout.set(this.targetLayout());
    this.visible.set(true);
    if (!reopening) this.scroll.stop();

    afterNextRender(
      () => {
        const panel = this.panelRef()?.nativeElement;
        const backdrop = this.backdropRef()?.nativeElement;
        if (!panel || !backdrop) return;
        const target = this.layout() ?? this.targetLayout();
        const from = this.originLayout(originRect);

        panel.style.transform = this.morph(from, target);
        panel.style.opacity = '0';
        panel.style.borderRadius = `${from.radius}px`;

        this.backdropAnimation = animate(backdrop, { opacity: 1 }, { duration: 0.5 });
        this.panelAnimation = animate(
          panel,
          { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1, borderRadius: `${target.radius}px` },
          {
            ...resolveTransition(POPUP_SPRING),
            onComplete: () => this.contentVisible.set(true),
          },
        );
        // Reveal content slightly before the spring fully settles.
        this.contentTimer = setTimeout(() => this.contentVisible.set(true), 380);
        panel.querySelector<HTMLElement>('.ov__close')?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  private animateClose(): void {
    const panel = this.panelRef()?.nativeElement;
    const backdrop = this.backdropRef()?.nativeElement;
    if (!panel || !backdrop || !this.origin) {
      this.finishClose();
      return;
    }
    const target = this.layout() ?? this.targetLayout();
    const from = this.originLayout(this.origin);
    this.clearContentTimer();
    this.contentVisible.set(false);
    this.backdropAnimation = animate(backdrop, { opacity: 0 }, { duration: 0.45 });
    this.panelAnimation = animate(
      panel,
      { transform: this.morph(from, target), opacity: 0, borderRadius: `${from.radius}px` },
      { ...resolveTransition({ ...POPUP_SPRING, stiffness: 260, damping: 30 }), onComplete: () => this.finishClose() },
    );
  }

  private finishClose(): void {
    this.visible.set(false);
    this.contentVisible.set(false);
    this.layout.set(null);
    this.origin = null;
    this.detailService.setOverlayOpen(false);
    this.scroll.start();
    this.previousFocus?.focus({ preventScroll: true });
    this.previousFocus = null;
  }

  private clearContentTimer(): void {
    if (this.contentTimer) clearTimeout(this.contentTimer);
    this.contentTimer = null;
  }

  private morph(from: PanelLayout, to: PanelLayout): string {
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  }

  private originLayout(rect: DOMRect): PanelLayout {
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, radius: 12 };
  }

  private targetLayout(): PanelLayout {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 760;
    const width = mobile ? vw - 16 : Math.min(1120, vw * 0.9);
    const height = mobile ? vh - 16 : Math.min(760, vh * 0.86);
    return { top: (vh - height) / 2, left: (vw - width) / 2, width, height, radius: mobile ? 16 : 24 };
  }
}
