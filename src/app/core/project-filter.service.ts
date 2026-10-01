import { computed, inject, Injectable, signal } from '@angular/core';
import { PortfolioDataStore } from './portfolio-data.store';
import type { PortfolioProject } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  private readonly store = inject(PortfolioDataStore);

  readonly selectedTag = signal<string | null>(null);

  readonly filteredProjects = computed((): readonly PortfolioProject[] => {
    const tag = this.selectedTag();
    const all = this.store.projects();
    if (!tag) return all;
    return all.filter((p) => projectUsesTech(p, tag));
  });

  setTag(tag: string): void {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
  }

  clear(): void {
    this.selectedTag.set(null);
  }
}

export function projectUsesTech(project: PortfolioProject, tech: string): boolean {
  const needle = tech.toLowerCase();
  return project.technologies.some((t) => t.toLowerCase() === needle);
}
