import {
  Component,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import Typed from 'typed.js';
import { ResponsiveService } from '../core/responsive.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ScrollToDirective } from '../core/scroll-to.directive';
import { ScrollAnimateDirective } from '../core/scroll-animate.directive';

@Component({
  selector: 'app-top-section',
  imports: [NavbarComponent, ScrollToDirective, ScrollAnimateDirective],
  templateUrl: './top-section.component.html',
  styleUrl: './top-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopSectionComponent implements AfterViewInit, OnDestroy {
  private readonly responsive = inject(ResponsiveService);
  private typedInstance: Typed | null = null;

  readonly typedTarget = viewChild<ElementRef<HTMLSpanElement>>('typedTarget');
  protected readonly isTablet = this.responsive.isTablet;

  ngAfterViewInit(): void {
    this.initTypedAnimation();
  }

  ngOnDestroy(): void {
    this.typedInstance?.destroy();
  }

  private initTypedAnimation(): void {
    const el = this.typedTarget()?.nativeElement;
    if (el) {
      this.typedInstance = new Typed(el, {
        strings: ['Developer', 'Enthusiast', 'Programmer'],
        typeSpeed: 50,
        backSpeed: 50,
        loop: true,
      });
    }
  }
}
