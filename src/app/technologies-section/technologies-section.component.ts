import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { PortfolioDataStore } from '../core/portfolio-data.store';
import { ProjectFilterService } from '../core/project-filter.service';
import { SpringAnimateDirective } from '../core/spring-animate.directive';
import { HeaderTextComponent } from '../header-text/header-text.component';

@Component({
  selector: 'app-technologies-section',
  imports: [SpringAnimateDirective, HeaderTextComponent],
  template: `
    <section id="Technologies" class="section-bg w-full flex justify-center py-16">
      <div class="tech-section-inner">
        <div appSpringAnimate springAnimation="fade-up">
          <app-header-text text="Technologies" />
        </div>

        @if (store.loading()) {
          <div class="tech-chips-grid">
            @for (skeleton of skeletons; track skeleton) {
              <div class="tech-chip-skeleton"></div>
            }
          </div>
        } @else if (store.technologies().length === 0) {
          <p class="tech-empty-state">No technology data available.</p>
        } @else {
          <p
            appSpringAnimate
            springAnimation="fade-in"
            [springDelay]="100"
            class="tech-section-hint"
          >
            Click a tag to filter projects
          </p>
          <div class="tech-chips-grid" role="list" aria-label="Technology tags">
            @for (tag of store.technologies(); track tag.name; let i = $index) {
              <button
                appSpringAnimate
                springAnimation="fade-up-slight"
                [springDelay]="i * 40"
                type="button"
                role="listitem"
                [attr.aria-pressed]="filterService.selectedTag() === tag.name"
                class="tech-chip liquid-glass"
                [class.tech-chip--active]="filterService.selectedTag() === tag.name"
                (click)="onTagClick(tag.name)"
              >
                <span class="tech-chip-name">{{ tag.name }}</span>
                @if (tag.projectCount > 0) {
                  <span class="tech-chip-count">{{ tag.projectCount }}</span>
                }
              </button>
            }
          </div>

          @if (filterService.selectedTag()) {
            <div
              appSpringAnimate
              springAnimation="fade-in"
              [springDelay]="0"
              [springImmediate]="true"
              class="tech-active-filter"
            >
              <span>Filtering by <strong>{{ filterService.selectedTag() }}</strong></span>
              <button type="button" class="tech-clear-btn" (click)="clearFilter()">
                Clear filter ×
              </button>
            </div>
          }
        }

        @if (store.error()) {
          <div class="tech-error-banner liquid-glass" role="alert">
            <span>⚠️ Couldn't refresh GitHub data. Showing cached or fallback data.</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tech-section-inner {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    @media (min-width: 640px) {
      .tech-section-inner { padding: 0 2rem; }
    }

    .tech-section-hint {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      letter-spacing: 0.03em;
    }

    .tech-chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
      padding: 0.25rem 0;
    }

    .tech-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: var(--text-secondary);
      cursor: pointer;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      backdrop-filter: blur(12px) saturate(150%);
      -webkit-backdrop-filter: blur(12px) saturate(150%);
      transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
      box-shadow: none;
    }

    .tech-chip:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      color: var(--accent);
    }

    .tech-chip--active {
      background: color-mix(in srgb, var(--accent) 20%, transparent);
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 30%, transparent);
    }

    .tech-chip-name {
      font-family: var(--font-sans);
    }

    .tech-chip-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.25rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 600;
      background: color-mix(in srgb, var(--accent) 25%, transparent);
      color: var(--accent);
    }

    .tech-chip--active .tech-chip-count {
      background: color-mix(in srgb, var(--accent) 40%, transparent);
    }

    /* Skeleton */
    .tech-chip-skeleton {
      display: inline-block;
      width: clamp(60px, 10vw, 120px);
      height: 2.25rem;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--glass-bg) 25%, var(--glass-border) 50%, var(--glass-bg) 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .tech-active-filter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.25rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .tech-clear-btn {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      border: 1px solid var(--accent);
      background: transparent;
      color: var(--accent);
      font-size: 0.8125rem;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .tech-clear-btn:hover {
      background: color-mix(in srgb, var(--accent) 15%, transparent);
    }

    .tech-error-banner {
      margin-top: 1rem;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      border-radius: 12px;
    }

    .tech-empty-state {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnologiesSectionComponent {
  protected readonly store = inject(PortfolioDataStore);
  protected readonly filterService = inject(ProjectFilterService);
  protected readonly skeletons = Array(12).fill(0);

  protected onTagClick(tagName: string): void {
    this.filterService.setTag(tagName);
  }

  protected clearFilter(): void {
    this.filterService.clear();
  }
}
