import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { SignalFieldComponent } from './shell/signal-field/signal-field.component';
import { PreloaderComponent } from './shell/preloader/preloader.component';
import { CursorComponent } from './shell/cursor/cursor.component';
import { NavbarComponent } from './shell/navbar/navbar.component';
import { HeroComponent } from './sections/hero/hero.component';
import { AboutComponent } from './sections/about/about.component';
import { StackComponent } from './sections/stack/stack.component';
import { WorkComponent } from './sections/work/work.component';
import { ContactComponent } from './sections/contact/contact.component';
import { ProjectDetailOverlayComponent } from './project-detail-overlay/project-detail-overlay.component';
import { SmoothScrollService } from './core/smooth-scroll.service';
import { IntroService } from './core/intro.service';
import { hasFinePointer, prefersReducedMotion } from './core/motion.config';

@Component({
  selector: 'app-root',
  imports: [
    SignalFieldComponent,
    PreloaderComponent,
    CursorComponent,
    NavbarComponent,
    HeroComponent,
    AboutComponent,
    StackComponent,
    WorkComponent,
    ContactComponent,
    ProjectDetailOverlayComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly scroll = inject(SmoothScrollService);
  protected readonly intro = inject(IntroService);
  protected readonly showCursor = signal(false);

  constructor() {
    afterNextRender(() => {
      this.scroll.init();
      this.showCursor.set(hasFinePointer() && !prefersReducedMotion());
    });
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.scroll.scrollTo('about', { immediate: true });
    document.getElementById('about')?.focus({ preventScroll: true });
  }
}
