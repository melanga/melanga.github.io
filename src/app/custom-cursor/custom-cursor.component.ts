import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

interface CursorPosition {
  mouseX: number;
  mouseY: number;
  destinationX: number;
  destinationY: number;
  distanceX: number;
  distanceY: number;
}

const EASING_FACTOR = 0.4;
const SNAP_THRESHOLD = 0.1;
const CLICKABLE_SELECTOR = 'a, button, [role="button"]';
const INERT_TAGS = new Set([
  'html',
  'body',
  'div',
  'p',
  'span',
  'section',
  'article',
  'main',
  'header',
  'footer',
  'nav',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'canvas',
  'svg',
  'path',
  'g',
  'line',
  'circle',
  'rect',
  'img',
  'ul',
  'ol',
  'li',
  'td',
  'th',
  'tr',
  'table',
  'thead',
  'tbody',
]);

@Component({
  selector: 'app-custom-cursor',
  templateUrl: './custom-cursor.component.html',
  styleUrl: './custom-cursor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCursorComponent implements AfterViewInit, OnDestroy {
  private readonly cursorRef = viewChild<ElementRef<HTMLDivElement>>('cursor');
  private animationFrameId: number | null = null;
  private pointerActive = false;
  private readonly position: CursorPosition = {
    mouseX: 0,
    mouseY: 0,
    destinationX: 0,
    destinationY: 0,
    distanceX: 0,
    distanceY: 0,
  };

  ngAfterViewInit(): void {
    this.addEventListeners();
    this.tick();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private addEventListeners(): void {
    const opts: AddEventListenerOptions = { passive: true };
    document.addEventListener('pointermove', this.trackPointerPosition, opts);
    document.addEventListener('pointerover', this.onPointerOver, opts);
    document.addEventListener('pointerout', this.onPointerOut, opts);
  }

  private removeEventListeners(): void {
    document.removeEventListener('pointermove', this.trackPointerPosition);
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
  }

  private trackPointerPosition = (event: PointerEvent): void => {
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;
    this.pointerActive = true;
    this.position.mouseX = event.clientX - cursor.offsetWidth / 2;
    this.position.mouseY = event.clientY - cursor.offsetHeight / 2;
  };

  private onPointerOver = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (this.isClickable(target)) {
      this.applyHoverState(true);
    }
  };

  private onPointerOut = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !this.isClickable(target)) return;

    const related = event.relatedTarget;
    if (related instanceof HTMLElement && related.closest(CLICKABLE_SELECTOR)) {
      return;
    }
    this.applyHoverState(false);
  };

  private isClickable(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button') return true;
    if (el.getAttribute('role') === 'button') return true;

    if (!INERT_TAGS.has(tag)) {
      return el.closest(CLICKABLE_SELECTOR) !== null;
    }

    const parent = el.parentElement;
    if (!parent) return false;
    const parentTag = parent.tagName.toLowerCase();
    if (parentTag === 'a' || parentTag === 'button') return true;
    if (parent.getAttribute('role') === 'button') return true;
    return parent.closest(CLICKABLE_SELECTOR) !== null;
  }

  private applyHoverState(hover: boolean): void {
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;
    cursor.classList.toggle('cursor-hover', hover);
  }

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;

    if (this.pointerActive) {
      const { mouseX, mouseY, destinationX, destinationY, distanceX, distanceY } = this.position;

      if (!destinationX && !destinationY) {
        this.position.destinationX = mouseX;
        this.position.destinationY = mouseY;
      } else {
        this.position.distanceX = (mouseX - destinationX) * EASING_FACTOR;
        this.position.distanceY = (mouseY - destinationY) * EASING_FACTOR;

        if (Math.abs(this.position.distanceX) + Math.abs(this.position.distanceY) < SNAP_THRESHOLD) {
          this.position.destinationX = mouseX;
          this.position.destinationY = mouseY;
        } else {
          this.position.destinationX += distanceX;
          this.position.destinationY += distanceY;
        }
      }

      cursor.style.transform = `translate3d(${this.position.destinationX}px, ${this.position.destinationY}px, 0)`;
    }
  };
}
