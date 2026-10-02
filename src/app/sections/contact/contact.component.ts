import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';
import { MagneticDirective } from '../../core/magnetic.directive';
import { TrackSectionDirective } from '../../core/track-section.directive';
import { SectionHeadComponent } from '../../shared/section-head/section-head.component';
import { SmoothScrollService } from '../../core/smooth-scroll.service';
import { LocalTimeService } from '../../core/local-time.service';
import { SITE } from '../../core/site.config';

@Component({
  selector: 'app-contact',
  imports: [RevealDirective, MagneticDirective, TrackSectionDirective, SectionHeadComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnDestroy {
  private readonly scroll = inject(SmoothScrollService);
  protected readonly clock = inject(LocalTimeService);
  protected readonly site = SITE;
  protected readonly year = new Date().getFullYear();
  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }

  protected async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(SITE.email);
      this.copied.set(true);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.copied.set(false), 2200);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  }

  protected backToTop(event: Event): void {
    event.preventDefault();
    this.scroll.scrollTo(0, { duration: 2.4 });
  }
}
