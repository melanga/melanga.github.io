import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { GitHubPortfolioService } from './github-portfolio.service';
import { FALLBACK_PORTFOLIO_DATA } from './portfolio-fallback.data';
import type { PortfolioLoadingState, PortfolioProject, TechnologyTag } from './portfolio.models';

const INITIAL_STATE: PortfolioLoadingState = { status: 'loading' };

@Injectable({ providedIn: 'root' })
export class PortfolioDataStore {
  private readonly githubService = inject(GitHubPortfolioService);

  private readonly state = toSignal<PortfolioLoadingState>(
    this.githubService.loadPortfolio().pipe(
      map((data): PortfolioLoadingState => ({ status: 'success', data })),
      startWith(INITIAL_STATE),
    ),
    { requireSync: true },
  );

  readonly loading = computed(() => this.state().status === 'loading');

  /** Where the projects on screen came from: GitHub (live or cached) or the bundled snapshot. */
  readonly source = computed((): 'loading' | 'github' | 'snapshot' => {
    const s = this.state();
    if (s.status === 'loading') return 'loading';
    return s.status === 'success' && s.data.fetchedAt > 0 ? 'github' : 'snapshot';
  });

  readonly error = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.error : null;
  });

  readonly projects = computed((): readonly PortfolioProject[] => {
    const s = this.state();
    if (s.status === 'success') return s.data.projects;
    if (s.status === 'error') return s.fallback.projects;
    return FALLBACK_PORTFOLIO_DATA.projects;
  });

  readonly technologies = computed((): readonly TechnologyTag[] => {
    const s = this.state();
    if (s.status === 'success') return s.data.technologies;
    if (s.status === 'error') return s.fallback.technologies;
    return [];
  });
}
