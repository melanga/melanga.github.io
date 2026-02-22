import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-header-text',
  template: `
    <div class="flex flex-row justify-start w-fit md:w-[53%] gap-2">
      <h2 class="text-transparent bg-clip-text bg-gray-100 w-fit whitespace-nowrap text-3xl lg:text-5xl font-bold sm:m-0 drop-shadow-[2px_1px_10px_#44444436] text-left">
        {{ text() }}
      </h2>
      <div class="w-full border border-cyan-200 self-center"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderTextComponent {
  readonly text = input.required<string>();
}
