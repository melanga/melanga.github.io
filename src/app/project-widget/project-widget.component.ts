import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ResponsiveService } from '../core/responsive.service';
import type { Project } from '../core/projects.data';

@Component({
  selector: 'app-project-widget',
  imports: [NgOptimizedImage],
  templateUrl: './project-widget.component.html',
  styleUrl: './project-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectWidgetComponent {
  private readonly responsive = inject(ResponsiveService);

  readonly project = input.required<Project>();
  readonly imgLeft = input<boolean>(true);

  protected readonly isMobile = this.responsive.isMobile;
}
