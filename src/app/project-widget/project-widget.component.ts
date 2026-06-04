import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  ElementRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProjectDetailService } from '../core/project-detail.service';
import type { PortfolioProject } from '../core/portfolio.models';

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
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
};

const ORB_GRADIENTS: Record<string, string> = {
  JavaScript:
    'radial-gradient(circle at center, rgba(247, 223, 30, 0.55) 0%, rgba(247, 223, 30, 0.2) 40%, transparent 72%)',
  TypeScript:
    'radial-gradient(circle at center, rgba(49, 120, 198, 0.55) 0%, rgba(49, 120, 198, 0.2) 40%, transparent 72%)',
  Python:
    'radial-gradient(circle at center, rgba(53, 114, 165, 0.55) 0%, rgba(53, 114, 165, 0.2) 40%, transparent 72%)',
  Dart:
    'radial-gradient(circle at center, rgba(0, 180, 171, 0.55) 0%, rgba(0, 180, 171, 0.2) 40%, transparent 72%)',
  Java:
    'radial-gradient(circle at center, rgba(176, 114, 25, 0.55) 0%, rgba(176, 114, 25, 0.2) 40%, transparent 72%)',
  default:
    'radial-gradient(circle at center, color-mix(in srgb, var(--accent-deep) 55%, transparent) 0%, color-mix(in srgb, var(--accent-muted) 25%, transparent) 40%, transparent 72%)',
};

@Component({
  selector: 'app-project-widget',
  imports: [DatePipe],
  templateUrl: './project-widget.component.html',
  styleUrl: './project-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectWidgetComponent {
  private readonly detailService = inject(ProjectDetailService);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly project = input.required<PortfolioProject>();

  protected openDetails(event: Event): void {
    if ((event.target as HTMLElement).closest('a')) return;
    const rect = this.hostRef.nativeElement.getBoundingClientRect();
    this.detailService.open(this.project(), rect);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const rect = this.hostRef.nativeElement.getBoundingClientRect();
      this.detailService.open(this.project(), rect);
    }
  }

  protected getLangColor(lang: string | null): string {
    return lang ? (LANG_COLORS[lang] ?? '#6b7280') : '#6b7280';
  }

  protected getOrbGradient(lang: string | null): string {
    return lang ? (ORB_GRADIENTS[lang] ?? ORB_GRADIENTS['default']) : ORB_GRADIENTS['default'];
  }
}
