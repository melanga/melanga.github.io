import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResponsiveService } from './core/responsive.service';
import { CustomCursorComponent } from './custom-cursor/custom-cursor.component';
import { NavbarComponent } from './navbar/navbar.component';
import { TopSectionComponent } from './top-section/top-section.component';
import { TechnologiesSectionComponent } from './technologies-section/technologies-section.component';
import { ProjectsSectionComponent } from './projects-section/projects-section.component';
import { ContactMeSectionComponent } from './contact-me-section/contact-me-section.component';
import { NeuralNetworkBackgroundComponent } from './shared/neural-network-background/neural-network-background.component';
import { ProjectDetailOverlayComponent } from './project-detail-overlay/project-detail-overlay.component';

@Component({
  selector: 'app-root',
  imports: [
    CustomCursorComponent,
    NavbarComponent,
    TopSectionComponent,
    TechnologiesSectionComponent,
    ProjectsSectionComponent,
    ContactMeSectionComponent,
    NeuralNetworkBackgroundComponent,
    ProjectDetailOverlayComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly responsive = inject(ResponsiveService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly showCustomCursor = this.responsive.showCustomCursor;

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.body.classList.toggle('cursor-none', this.showCustomCursor());
      }
    });
  }
}
