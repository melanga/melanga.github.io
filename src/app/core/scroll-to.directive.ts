import { Directive, inject, input, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollTo]',
  host: {
    '(click)': 'scrollToAnchor($event)',
  },
})
export class ScrollToDirective {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  readonly anchorId = input.required<string>();

  protected scrollToAnchor(event: Event): void {
    event.preventDefault();
    if (!isPlatformBrowser(this.platformId)) return;

    const id = this.anchorId();
    if (!id) return;

    const target = this.document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
