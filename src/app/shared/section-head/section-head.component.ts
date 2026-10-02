import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RevealDirective } from '../../core/reveal.directive';
import { ScrambleDirective } from '../../core/scramble.directive';

/** `[01] INPUT ———————— About` — every section is a layer of the network. */
@Component({
  selector: 'app-section-head',
  imports: [RevealDirective, ScrambleDirective],
  template: `
    <div class="section-head">
      <span class="label section-head__index">[{{ index() }}]</span>
      <span class="label" [appScramble]="layer()"></span>
      <span class="section-head__rule" appReveal="rule"></span>
      <span class="label" [appScramble]="title()" [scrambleDelay]="250"></span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeadComponent {
  readonly index = input.required<string>();
  readonly layer = input.required<string>();
  readonly title = input.required<string>();
}
