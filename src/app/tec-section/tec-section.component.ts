import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ScrollAnimateDirective } from '../core/scroll-animate.directive';
import {
  simpleTensorflow,
  simpleScikitlearn,
  simplePython,
  simpleFlutter,
  simpleFirebase,
  simpleGit,
  simpleReact,
  simpleTailwindcss,
  simpleJavascript,
} from '@ng-icons/simple-icons';

interface TechItem {
  readonly name: string;
  readonly icon: string;
}

const TECH_DETAILS: readonly TechItem[] = [
  { name: 'TensorFlow', icon: 'simpleTensorflow' },
  { name: 'Scikit-learn', icon: 'simpleScikitlearn' },
  { name: 'Python', icon: 'simplePython' },
  { name: 'Flutter', icon: 'simpleFlutter' },
  { name: 'Firebase', icon: 'simpleFirebase' },
  { name: 'Git', icon: 'simpleGit' },
  { name: 'React', icon: 'simpleReact' },
  { name: 'Tailwind CSS', icon: 'simpleTailwindcss' },
  { name: 'JavaScript', icon: 'simpleJavascript' },
];

@Component({
  selector: 'app-tec-section',
  imports: [NgIcon, ScrollAnimateDirective],
  viewProviders: [
    provideIcons({
      simpleTensorflow,
      simpleScikitlearn,
      simplePython,
      simpleFlutter,
      simpleFirebase,
      simpleGit,
      simpleReact,
      simpleTailwindcss,
      simpleJavascript,
    }),
  ],
  templateUrl: './tec-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TecSectionComponent {
  protected readonly techDetails = TECH_DETAILS;

  protected staggerDelay(index: number): string {
    return `${index * 80}ms`;
  }
}
