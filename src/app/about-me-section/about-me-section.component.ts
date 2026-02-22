import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderTextComponent } from '../header-text/header-text.component';
import { ProfileImageComponent } from '../profile-image/profile-image.component';
import { TecSectionComponent } from '../tec-section/tec-section.component';
import { ScrollAnimateDirective } from '../core/scroll-animate.directive';

@Component({
  selector: 'app-about-me-section',
  imports: [HeaderTextComponent, ProfileImageComponent, TecSectionComponent, ScrollAnimateDirective],
  templateUrl: './about-me-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMeSectionComponent {}
