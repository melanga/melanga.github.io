import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollAnimateDirective } from '../core/scroll-animate.directive';

@Component({
  selector: 'app-contact-me-section',
  imports: [ScrollAnimateDirective],
  templateUrl: './contact-me-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactMeSectionComponent {}
