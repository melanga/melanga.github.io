import { Injectable, signal } from '@angular/core';
import type { PortfolioProject } from './portfolio.models';

export interface ProjectDetailSelection {
  readonly project: PortfolioProject;
  readonly originRect: DOMRect;
}

@Injectable({ providedIn: 'root' })
export class ProjectDetailService {
  readonly selected = signal<ProjectDetailSelection | null>(null);

  private readonly overlayOpenState = signal(false);
  readonly overlayOpen = this.overlayOpenState.asReadonly();

  open(project: PortfolioProject, originRect: DOMRect): void {
    this.selected.set({ project, originRect });
  }

  close(): void {
    this.selected.set(null);
  }

  setOverlayOpen(open: boolean): void {
    this.overlayOpenState.set(open);
  }
}
