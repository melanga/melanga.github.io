import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HeaderTextComponent } from '../header-text/header-text.component';
import { ProjectWidgetComponent } from '../project-widget/project-widget.component';
import { SpringAnimateDirective } from '../core/spring-animate.directive';
import { PortfolioDataStore } from '../core/portfolio-data.store';
import { ProjectFilterService } from '../core/project-filter.service';

export const PROJECTS_PAGE_SIZE = 6;

@Component({
  selector: 'app-projects-section',
  imports: [HeaderTextComponent, ProjectWidgetComponent, SpringAnimateDirective],
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSectionComponent {
  protected readonly store = inject(PortfolioDataStore);
  protected readonly filterService = inject(ProjectFilterService);
  protected readonly filteredProjects = this.filterService.filteredProjects;
  protected readonly PAGE_SIZE = PROJECTS_PAGE_SIZE;
  protected readonly skeletons = Array(PROJECTS_PAGE_SIZE).fill(0);

  private readonly visibleCount = signal(PROJECTS_PAGE_SIZE);

  protected readonly visibleProjects = computed(() =>
    this.filteredProjects().slice(0, this.visibleCount()),
  );

  protected readonly hasMore = computed(
    () => this.visibleCount() < this.filteredProjects().length,
  );

  protected readonly remainingCount = computed(
    () => this.filteredProjects().length - this.visibleCount(),
  );

  constructor() {
    effect(() => {
      this.filterService.selectedTag();
      this.filteredProjects();
      this.visibleCount.set(PROJECTS_PAGE_SIZE);
    });
  }

  protected loadMore(): void {
    this.visibleCount.update((count) =>
      Math.min(count + PROJECTS_PAGE_SIZE, this.filteredProjects().length),
    );
  }
}
