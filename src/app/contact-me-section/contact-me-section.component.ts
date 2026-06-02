import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SpringAnimateDirective } from '../core/spring-animate.directive';
import { LiquidGlassPanelComponent } from '../shared/liquid-glass-panel/liquid-glass-panel.component';

@Component({
  selector: 'app-contact-me-section',
  imports: [SpringAnimateDirective, LiquidGlassPanelComponent],
  templateUrl: './contact-me-section.component.html',
  styleUrl: './contact-me-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactMeSectionComponent {}
