import { computed, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PortfolioDataStore } from './portfolio-data.store';
import type { PortfolioProject } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  private readonly store = inject(PortfolioDataStore);
  private readonly doc = inject(DOCUMENT);

  readonly selectedTag = signal<string | null>(null);

  readonly filteredProjects = computed((): readonly PortfolioProject[] => {
    const tag = this.selectedTag();
    const all = this.store.projects();
    if (!tag) return all;
    return all.filter((p) =>
      p.technologies.some((t) => t.toLowerCase() === tag.toLowerCase()),
    );
  });

  setTag(tag: string): void {
    if (this.selectedTag() === tag) {
      this.selectedTag.set(null);
      return;
    }
    this.selectedTag.set(tag);
    this.scrollToProjects();
  }

  clear(): void {
    this.selectedTag.set(null);
  }

  private scrollToProjects(): void {
    setTimeout(() => {
      const el = this.doc.getElementById('Projects');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}
