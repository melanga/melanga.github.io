import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  signal,
  ElementRef,
  viewChild,
  OnDestroy,
  PLATFORM_ID,
  HostListener,
  afterNextRender,
  Injector,
} from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { animate, type AnimationPlaybackControls } from 'motion';
import { ProjectDetailService } from '../core/project-detail.service';
import { LiquidGlassPanelComponent } from '../shared/liquid-glass-panel/liquid-glass-panel.component';
import { POPUP_SPRING, resolveTransition } from '../core/motion.config';

interface PanelLayout {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Dart: '#00B4AB',
  Java: '#b07219',
  Kotlin: '#7F52FF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
};

@Component({
  selector: 'app-project-detail-overlay',
  imports: [LiquidGlassPanelComponent, DatePipe],
  template: `
    @if (visible()) {
      <div
        class="overlay-root"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="dialogLabel()"
      >
        <div
          #backdrop
          class="overlay-backdrop fixed inset-0 z-[100]"
          (click)="onBackdropClick()"
          aria-hidden="true"
        ></div>

        <div
          #panel
          class="overlay-panel fixed z-[101] overflow-hidden"
          [style.top.px]="panelLayout()?.top"
          [style.left.px]="panelLayout()?.left"
          [style.width.px]="panelLayout()?.width"
          [style.height.px]="panelLayout()?.height"
          [style.border-radius.px]="panelLayout()?.borderRadius"
        >
          @if (detailService.selected(); as selection) {
            @let proj = selection.project;
            <app-liquid-glass-panel extraClass="h-full flex flex-col overflow-hidden relative">
              <button
                type="button"
                class="close-btn"
                (click)="close()"
                aria-label="Close project details"
              >
                &times;
              </button>

              <div class="overlay-content" [class.overlay-content--visible]="contentVisible()">
                <!-- Decorative header band -->
                <div
                  class="overlay-header-band"
                  [style.background]="getHeaderGradient(proj.primaryLanguage)"
                >
                  <div class="overlay-header-inner">
                    <div class="overlay-title-row">
                      @if (proj.primaryLanguage) {
                        <span
                          class="overlay-lang-dot"
                          [style.background]="getLangColor(proj.primaryLanguage)"
                          aria-hidden="true"
                        ></span>
                      }
                      <h2 class="overlay-title">{{ proj.displayName }}</h2>
                    </div>
                    <p class="overlay-repo-slug">{{ proj.name }}</p>
                  </div>
                </div>

                <!-- Scrollable body -->
                <div class="overlay-body">
                  <p class="overlay-description">{{ proj.description }}</p>

                  <!-- Technology tags -->
                  @if (proj.technologies.length > 0) {
                    <div class="overlay-section">
                      <h3 class="overlay-section-title">Technologies</h3>
                      <div class="overlay-tags">
                        @for (tech of proj.technologies; track tech) {
                          <span class="overlay-tag">{{ tech }}</span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Language breakdown -->
                  @if (proj.languageBreakdown.size > 0) {
                    <div class="overlay-section">
                      <h3 class="overlay-section-title">Languages</h3>
                      <div class="overlay-lang-bars">
                        @for (entry of langEntries(proj.languageBreakdown); track entry[0]) {
                          <div class="lang-bar-row">
                            <span
                              class="lang-bar-dot"
                              [style.background]="getLangColor(entry[0])"
                            ></span>
                            <span class="lang-bar-name">{{ entry[0] }}</span>
                            <div class="lang-bar-track">
                              <div
                                class="lang-bar-fill"
                                [style.width.%]="entry[1]"
                                [style.background]="getLangColor(entry[0])"
                              ></div>
                            </div>
                            <span class="lang-bar-pct">{{ entry[1] }}%</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Topics -->
                  @if (proj.topics.length > 0) {
                    <div class="overlay-section">
                      <h3 class="overlay-section-title">Topics</h3>
                      <div class="overlay-tags overlay-tags--muted">
                        @for (topic of proj.topics; track topic) {
                          <span class="overlay-tag overlay-tag--muted">{{ topic }}</span>
                        }
                      </div>
                    </div>
                  }

                  <!-- Stats row -->
                  <div class="overlay-stats">
                    @if (proj.stars > 0) {
                      <span class="overlay-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor" class="overlay-stat-icon">
                          <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.873 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                        </svg>
                        {{ proj.stars }} stars
                      </span>
                    }
                    @if (proj.forks > 0) {
                      <span class="overlay-stat">
                        <svg viewBox="0 0 16 16" fill="currentColor" class="overlay-stat-icon">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                        </svg>
                        {{ proj.forks }} forks
                      </span>
                    }
                    <span class="overlay-stat">
                      Updated {{ proj.updatedAt | date: 'MMM d, yyyy' }}
                    </span>
                  </div>

                  <!-- Links -->
                  <div class="overlay-links">
                    <a
                      [href]="proj.htmlUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="overlay-link-btn"
                      (click)="$event.stopPropagation()"
                    >
                      <svg fill="currentColor" viewBox="0 0 24 24" class="overlay-link-icon">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      View on GitHub
                    </a>
                    @if (proj.homepageUrl) {
                      <a
                        [href]="proj.homepageUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="overlay-link-btn overlay-link-btn--secondary"
                        (click)="$event.stopPropagation()"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="overlay-link-icon">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Live Site
                      </a>
                    }
                  </div>
                </div>
              </div>
            </app-liquid-glass-panel>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .overlay-root {
      position: fixed;
      inset: 0;
      z-index: 100;
    }

    .overlay-panel {
      opacity: 0;
      transform-origin: center center;
      box-shadow: var(--glass-shadow), 0 24px 80px rgba(13, 148, 136, 0.25);
    }

    .overlay-panel--animating {
      will-change: transform, opacity;
    }

    .close-btn {
      position: absolute;
      top: 12px;
      right: 16px;
      z-index: 20;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      font-size: 1.5rem;
      line-height: 1;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      transition: color 0.2s ease;
    }

    .close-btn:hover { color: var(--accent); }

    .overlay-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .overlay-content--visible {
      opacity: 1;
    }

    .overlay-header-band {
      flex-shrink: 0;
      padding: 1.75rem 1.75rem 1.25rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .overlay-header-inner {
      max-width: 640px;
    }

    .overlay-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 0.25rem;
    }

    .overlay-lang-dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .overlay-title {
      font-family: var(--font-display);
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      font-weight: 600;
      letter-spacing: var(--tracking-tight);
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .overlay-repo-slug {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'SFMono-Regular', Consolas, monospace;
      margin: 0;
    }

    .overlay-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      scrollbar-width: thin;
      scrollbar-color: var(--glass-border) transparent;
    }

    .overlay-description {
      font-size: 0.9375rem;
      line-height: 1.65;
      color: var(--text-secondary);
      margin: 0;
    }

    .overlay-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .overlay-section-title {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin: 0;
    }

    .overlay-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .overlay-tag {
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--accent) 15%, transparent);
      color: var(--accent);
      border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
    }

    .overlay-tag--muted {
      background: var(--glass-bg);
      color: var(--text-muted);
      border-color: var(--glass-border);
    }

    /* Language bars */
    .overlay-lang-bars {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .lang-bar-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .lang-bar-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .lang-bar-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
      width: 5rem;
      flex-shrink: 0;
    }

    .lang-bar-track {
      flex: 1;
      height: 4px;
      border-radius: 999px;
      background: var(--glass-border);
      overflow: hidden;
    }

    .lang-bar-fill {
      height: 100%;
      border-radius: 999px;
      opacity: 0.8;
    }

    .lang-bar-pct {
      font-size: 0.7rem;
      color: var(--text-muted);
      width: 2.5rem;
      text-align: right;
      flex-shrink: 0;
    }

    /* Stats */
    .overlay-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .overlay-stat {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .overlay-stat-icon {
      width: 0.875rem;
      height: 0.875rem;
    }

    /* Links */
    .overlay-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .overlay-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: transform 0.2s ease, background 0.2s ease;
      background: var(--accent-deep);
      color: #f8fafc;
      border: 1px solid transparent;
    }

    .overlay-link-btn:hover {
      transform: translateY(-1px);
      background: var(--accent-muted);
    }

    .overlay-link-btn--secondary {
      background: var(--glass-bg);
      color: var(--text-primary);
      border-color: var(--glass-border);
      backdrop-filter: blur(12px);
    }

    .overlay-link-btn--secondary:hover {
      border-color: var(--accent);
      color: var(--accent);
    }

    .overlay-link-icon {
      width: 1rem;
      height: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailOverlayComponent implements OnDestroy {
  protected readonly detailService = inject(ProjectDetailService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly backdropRef = viewChild<ElementRef<HTMLElement>>('backdrop');

  protected readonly visible = signal(false);
  protected readonly contentVisible = signal(false);
  protected readonly panelLayout = signal<PanelLayout | null>(null);

  private panelAnimation: AnimationPlaybackControls | null = null;
  private backdropAnimation: AnimationPlaybackControls | null = null;
  private storedOrigin: DOMRect | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const selection = this.detailService.selected();
      if (selection && isPlatformBrowser(this.platformId)) {
        this.storedOrigin = selection.originRect;
        this.openOverlay(selection.originRect);
      } else if (!selection && this.visible()) {
        this.animateClose();
      }
    });
  }

  ngOnDestroy(): void {
    this.panelAnimation?.stop();
    this.backdropAnimation?.stop();
    this.detailService.setOverlayOpen(false);
    this.unlockScroll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.close();
    }
  }

  protected onBackdropClick(): void {
    this.close();
  }

  protected close(): void {
    this.detailService.close();
  }

  protected dialogLabel(): string {
    const selection = this.detailService.selected();
    return selection ? selection.project.displayName : 'Project details';
  }

  protected langEntries(map: ReadonlyMap<string, number>): [string, number][] {
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }

  protected getLangColor(lang: string | null): string {
    return lang ? (LANG_COLORS[lang] ?? '#6b7280') : '#6b7280';
  }

  protected getHeaderGradient(lang: string | null): string {
    const color = lang ? (LANG_COLORS[lang] ?? '#0d9488') : '#0d9488';
    return `linear-gradient(135deg, color-mix(in srgb, ${color} 15%, transparent), transparent 70%)`;
  }

  private openOverlay(originRect: DOMRect): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.contentVisible.set(false);
    this.detailService.setOverlayOpen(true);
    this.panelLayout.set(this.computeTargetLayout());
    this.visible.set(true);
    this.lockScroll();

    afterNextRender(
      () => {
        const panel = this.panelRef()?.nativeElement;
        const backdrop = this.backdropRef()?.nativeElement;
        if (!panel || !backdrop) return;

        const origin = this.computeOriginLayout(originRect);
        const target = this.panelLayout() ?? this.computeTargetLayout();

        panel.style.transform = this.morphTransform(origin, target);
        panel.style.opacity = '0';
        panel.style.borderRadius = `${origin.borderRadius}px`;
        panel.classList.add('overlay-panel--animating');

        this.backdropAnimation = animate(backdrop, { opacity: 1 }, { duration: 0.3 });

        this.panelAnimation = animate(
          panel,
          {
            transform: 'translate(0px, 0px) scale(1)',
            opacity: 1,
            borderRadius: `${target.borderRadius}px`,
          },
          {
            ...resolveTransition(POPUP_SPRING),
            onComplete: () => {
              panel.classList.remove('overlay-panel--animating');
              this.contentVisible.set(true);
            },
          },
        );

        panel.querySelector<HTMLElement>('.close-btn')?.focus();
      },
      { injector: this.injector },
    );
  }

  private animateClose(): void {
    const panel = this.panelRef()?.nativeElement;
    const backdrop = this.backdropRef()?.nativeElement;
    if (!panel || !backdrop || !this.storedOrigin) {
      this.finishClose();
      return;
    }

    const origin = this.computeOriginLayout(this.storedOrigin);
    const target = this.panelLayout() ?? this.computeTargetLayout();
    this.contentVisible.set(false);
    panel.classList.add('overlay-panel--animating');

    this.backdropAnimation = animate(backdrop, { opacity: 0 }, { duration: 0.25 });
    this.panelAnimation = animate(
      panel,
      {
        transform: this.morphTransform(origin, target),
        opacity: 0,
        borderRadius: `${origin.borderRadius}px`,
      },
      {
        ...resolveTransition(POPUP_SPRING),
        onComplete: () => this.finishClose(),
      },
    );
  }

  private finishClose(): void {
    const panel = this.panelRef()?.nativeElement;
    if (panel) {
      panel.classList.remove('overlay-panel--animating');
      panel.style.transform = '';
      panel.style.opacity = '';
    }
    this.detailService.setOverlayOpen(false);
    this.visible.set(false);
    this.contentVisible.set(false);
    this.panelLayout.set(null);
    this.storedOrigin = null;
    this.unlockScroll();
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private morphTransform(origin: PanelLayout, target: PanelLayout): string {
    const originCenterX = origin.left + origin.width / 2;
    const originCenterY = origin.top + origin.height / 2;
    const targetCenterX = target.left + target.width / 2;
    const targetCenterY = target.top + target.height / 2;
    const scaleX = origin.width / target.width;
    const scaleY = origin.height / target.height;
    const translateX = originCenterX - targetCenterX;
    const translateY = originCenterY - targetCenterY;
    return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  }

  private computeOriginLayout(rect: DOMRect): PanelLayout {
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 10 };
  }

  private computeTargetLayout(): PanelLayout {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;
    const width = isMobile ? vw * 0.92 : Math.min(720, vw * 0.85);
    const height = isMobile ? vh * 0.88 : Math.min(600, vh * 0.82);
    return { top: (vh - height) / 2, left: (vw - width) / 2, width, height, borderRadius: 24 };
  }

  private lockScroll(): void {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}
