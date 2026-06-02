import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `<div class="font-display font-semibold text-xl tracking-tight logo-text">Portfolio</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
