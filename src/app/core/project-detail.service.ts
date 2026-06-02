import { Injectable, signal } from '@angular/core';
import type { PortfolioProject } from './portfolio.models';

export interface ProjectDetailSelection {
  readonly project: PortfolioProject;
  readonly originRect: DOMRect;
}

@Injectable({ providedIn: 'root' })
export class ProjectDetailService {
  readonly selected = signal<ProjectDetailSelection | null>(null);

  open(project: PortfolioProject, originRect: DOMRect): void {
    this.selected.set({ project, originRect });
  }

  close(): void {
    this.selected.set(null);
  }
}
