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

@Component({
  selector: 'app-custom-cursor',
  templateUrl: './custom-cursor.component.html',
  styleUrl: './custom-cursor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCursorComponent implements AfterViewInit, OnDestroy {
  private readonly cursorRef = viewChild<ElementRef<HTMLDivElement>>('cursor');
  private animationFrameId: number | null = null;
  private hovering = false;
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
    document.addEventListener('mousemove', this.trackMousePosition);
    document.addEventListener('mouseover', this.activateHoverState);
    document.addEventListener('mouseout', this.deactivateHoverState);
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.trackMousePosition);
    document.removeEventListener('mouseover', this.activateHoverState);
    document.removeEventListener('mouseout', this.deactivateHoverState);
  }

  private trackMousePosition = (event: MouseEvent): void => {
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;
    this.position.mouseX = event.clientX - cursor.offsetWidth / 2;
    this.position.mouseY = event.clientY - cursor.offsetHeight / 2;
  };

  private activateHoverState = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (this.isClickable(target)) {
      this.applyHoverState(true);
    }
  };

  private deactivateHoverState = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (this.isClickable(target)) {
      this.applyHoverState(false);
    }
  };

  private isClickable(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button') return true;
    if (el.getAttribute('role') === 'button') return true;
    return el.closest('a, button, [role="button"]') !== null;
  }

  private applyHoverState(hover: boolean): void {
    this.hovering = hover;
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;
    cursor.classList.toggle('cursor-hover', hover);
  }

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);
    const cursor = this.cursorRef()?.nativeElement;
    if (!cursor) return;

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
  };
}
