import { Directive, inject, input } from '@angular/core';
import { SmoothScrollService } from './smooth-scroll.service';

@Directive({
  selector: '[appScrollTo]',
  host: {
    '(click)': 'scrollToAnchor($event)',
  },
})
export class ScrollToDirective {
  private readonly scroll = inject(SmoothScrollService);
  readonly anchorId = input.required<string>();
  readonly scrollOffset = input(0);

  protected scrollToAnchor(event: Event): void {
    event.preventDefault();
    const id = this.anchorId();
    if (!id) return;
    this.scroll.scrollTo(id, { offset: this.scrollOffset() });
  }
}
