import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-gooey-filter',
  template: `
    <svg
      aria-hidden="true"
      class="pointer-events-none absolute w-0 h-0 overflow-hidden"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="liquid-gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GooeyFilterComponent {}
