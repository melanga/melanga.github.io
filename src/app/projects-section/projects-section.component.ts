import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderTextComponent } from '../header-text/header-text.component';
import { ProjectWidgetComponent } from '../project-widget/project-widget.component';
import { ScrollAnimateDirective } from '../core/scroll-animate.directive';
import { PROJECTS } from '../core/projects.data';

@Component({
  selector: 'app-projects-section',
  imports: [HeaderTextComponent, ProjectWidgetComponent, ScrollAnimateDirective],
  templateUrl: './projects-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSectionComponent {
  protected readonly projects = PROJECTS;
}
