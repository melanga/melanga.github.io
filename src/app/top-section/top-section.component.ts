import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  OnDestroy,
  ElementRef,
  afterNextRender,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import Typed from 'typed.js';
import { ScrollToDirective } from '../core/scroll-to.directive';
import { SpringAnimateDirective } from '../core/spring-animate.directive';

@Component({
  selector: 'app-top-section',
  imports: [ScrollToDirective, SpringAnimateDirective, NgOptimizedImage],
  templateUrl: './top-section.component.html',
  styleUrl: './top-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSectionComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private typedInstance: Typed | null = null;

  readonly typedTarget = viewChild<ElementRef<HTMLSpanElement>>('typedTarget');

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.initTypedAnimation();
      }
    });
  }

  ngOnDestroy(): void {
    this.typedInstance?.destroy();
    this.typedInstance = null;
  }

  private initTypedAnimation(): void {
    if (this.typedInstance) {
      return;
    }

    const el = this.typedTarget()?.nativeElement;
    if (!el) {
      return;
    }

    this.typedInstance = new Typed(el, {
      strings: ['Developer', 'Enthusiast', 'Programmer'],
      typeSpeed: 50,
      backSpeed: 40,
      backDelay: 1200,
      loop: true,
      smartBackspace: false,
      contentType: 'text',
      showCursor: true,
      cursorChar: '|',
    });
  }
}
