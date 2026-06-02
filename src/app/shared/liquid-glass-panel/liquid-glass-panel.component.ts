import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-liquid-glass-panel',
  template: `
    <div class="liquid-glass" [class]="extraClass()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidGlassPanelComponent {
  readonly extraClass = input('');
}
