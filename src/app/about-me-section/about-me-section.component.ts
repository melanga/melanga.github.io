import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderTextComponent } from '../header-text/header-text.component';
import { ProfileImageComponent } from '../profile-image/profile-image.component';
import { TecSectionComponent } from '../tec-section/tec-section.component';
import { SpringAnimateDirective } from '../core/spring-animate.directive';
import { LiquidGlassPanelComponent } from '../shared/liquid-glass-panel/liquid-glass-panel.component';

@Component({
  selector: 'app-about-me-section',
  imports: [
    HeaderTextComponent,
    ProfileImageComponent,
    TecSectionComponent,
    SpringAnimateDirective,
    LiquidGlassPanelComponent,
  ],
  templateUrl: './about-me-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeSectionComponent {}
