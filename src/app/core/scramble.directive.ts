import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { inView } from 'motion';
import { scrambleText } from './scramble';
import { IntroService } from './intro.service';
import { isBrowser, prefersReducedMotion } from './motion.config';

/** Decodes an element's text out of noise when it enters the viewport (and optionally on hover). */
@Directive({
  selector: '[appScramble]',
  host: {
    '(mouseenter)': 'onHover()',
    '(focus)': 'onHover()',
  },
})
export class ScrambleDirective implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly intro = inject(IntroService);

  /** Optional text; defaults to the element's own text content. */
  readonly appScramble = input<string>('');
  readonly scrambleOn = input<'view' | 'intro' | 'none'>('view');
  readonly scrambleHover = input(false);
  readonly scrambleDelay = input(0);
  readonly scrambleDuration = input(900);

  private text = '';
  private cancel: (() => void) | null = null;
  private stopInView: (() => void) | null = null;
  private played = false;

  constructor() {
    effect(() => {
      const revealed = this.intro.revealed();
      untracked(() => {
        if (revealed && this.scrambleOn() === 'intro' && this.text) this.play();
      });
    });
  }

  ngOnInit(): void {
    const el = this.host.nativeElement;
    this.text = this.appScramble() || (el.textContent ?? '').trim();
    // Bound text (`[appScramble]="label"`) renders into an empty host.
    if (!(el.textContent ?? '').trim()) el.textContent = this.text;
    if (!isBrowser() || prefersReducedMotion()) {
      this.played = true;
      return;
    }
    const trigger = this.scrambleOn();
    if (trigger === 'none') {
      this.played = true;
    } else if (trigger === 'intro' && !this.intro.revealed()) {
      el.style.visibility = 'hidden';
    } else if (trigger === 'intro') {
      this.play();
    } else if (trigger === 'view') {
      if (typeof IntersectionObserver === 'undefined') {
        this.played = true;
        return;
      }
      this.stopInView = inView(el, () => this.play(), { amount: 0.6 });
    }
  }

  ngOnDestroy(): void {
    this.cancel?.();
    this.stopInView?.();
  }

  protected onHover(): void {
    if (!this.scrambleHover() || !this.played) return;
    this.run(0, 520);
  }

  private play(): void {
    if (this.played) return;
    this.played = true;
    this.stopInView?.();
    this.host.nativeElement.style.visibility = '';
    this.run(this.scrambleDelay(), this.scrambleDuration());
  }

  private run(delay: number, duration: number): void {
    this.cancel?.();
    this.cancel = scrambleText(this.host.nativeElement, this.text, { delay, duration });
  }
}
