import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ResponsiveService } from '../core/responsive.service';
import { ThemeService } from '../core/theme.service';
import { ScrollToDirective } from '../core/scroll-to.directive';
import { LogoComponent } from '../logo/logo.component';

interface NavItem {
  readonly label: string;
  readonly anchorId: string;
}

@Component({
  selector: 'app-navbar',
  imports: [LogoComponent, ScrollToDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly responsive = inject(ResponsiveService);

  protected readonly themeService = inject(ThemeService);
  protected readonly isMobile = this.responsive.isMobile;
  protected readonly menuOpen = signal(false);
  protected readonly navItems: readonly NavItem[] = [
    { label: 'About', anchorId: 'About' },
    { label: 'Technologies', anchorId: 'Technologies' },
    { label: 'Projects', anchorId: 'Projects' },
    { label: 'Contact Me', anchorId: 'Contact-Me' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
