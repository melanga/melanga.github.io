import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-header-text',
  template: `
    <div class="flex flex-row justify-start w-fit md:w-[53%] gap-2">
      <h2 class="header-title font-display text-transparent bg-clip-text w-fit whitespace-nowrap text-3xl lg:text-5xl font-semibold sm:m-0 text-left">
        {{ text() }}
      </h2>
      <div class="w-full border header-line self-center"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderTextComponent {
  readonly text = input.required<string>();
}
