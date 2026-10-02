import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { SmoothScrollService } from './smooth-scroll.service';

/** Registers a section so the nav knows which layer of the page is in view. */
@Directive({
  selector: '[appTrackSection]',
})
export class TrackSectionDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly scroll = inject(SmoothScrollService);
  readonly appTrackSection = input.required<string>();
  private unregister: (() => void) | null = null;

  ngOnInit(): void {
    this.unregister = this.scroll.registerSection(this.appTrackSection(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.unregister?.();
  }
}
