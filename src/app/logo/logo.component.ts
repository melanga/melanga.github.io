import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `<div class="font-['Pacifico'] font-black text-2xl text-white">Portfolio</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {}
