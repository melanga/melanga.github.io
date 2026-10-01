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
import { animate, inView, stagger, type AnimationPlaybackControls } from 'motion';
import { EASE_OUT, isBrowser, prefersReducedMotion } from './motion.config';
import { IntroService } from './intro.service';

export type RevealMode = 'words' | 'fade' | 'rise' | 'rule' | 'clip';
export type RevealTrigger = 'view' | 'intro';

/** Wraps every word in a clipping mask so it can slide up into view. */
export function splitWords(root: HTMLElement): HTMLElement[] {
  const words: HTMLElement[] = [];
  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) continue;
        const frag = document.createDocumentFragment();
        for (const part of text.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            continue;
          }
          const mask = document.createElement('span');
          mask.className = 'word-mask';
          const word = document.createElement('span');
          word.className = 'word';
          word.textContent = part;
          mask.appendChild(word);
          frag.appendChild(mask);
          words.push(word);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName !== 'BR' && !el.classList.contains('word-mask')) walk(el);
      }
    }
  };
  walk(root);
  return words;
}

@Directive({
  selector: '[appReveal]',
  host: {
    '[attr.data-reveal]': 'appReveal()',
  },
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly intro = inject(IntroService);

  readonly appReveal = input<RevealMode>('rise');
  /** Delay in milliseconds. */
  readonly revealDelay = input(0);
  readonly revealTrigger = input<RevealTrigger>('view');
  readonly revealAmount = input(0.25);

  private words: HTMLElement[] = [];
  private stopInView: (() => void) | null = null;
  private controls: AnimationPlaybackControls | null = null;
  private played = false;

  constructor() {
    effect(() => {
      const revealed = this.intro.revealed();
      untracked(() => {
        if (revealed && this.revealTrigger() === 'intro') this.play();
      });
    });
  }

  ngOnInit(): void {
    if (!isBrowser()) return;
    const el = this.host.nativeElement;
    if (this.appReveal() === 'words') {
      this.words = splitWords(el);
    }
    if (prefersReducedMotion()) {
      this.played = true;
      return;
    }
    if (this.revealTrigger() === 'view') {
      if (typeof IntersectionObserver === 'undefined') {
        this.play();
        return;
      }
      this.stopInView = inView(
        el,
        () => {
          this.play();
        },
        { amount: this.revealAmount() },
      );
    }
  }

  ngOnDestroy(): void {
    this.stopInView?.();
    this.controls?.stop();
  }

  private play(): void {
    if (this.played || !isBrowser()) return;
    this.played = true;
    this.stopInView?.();
    const el = this.host.nativeElement;
    const delay = this.revealDelay() / 1000;

    switch (this.appReveal()) {
      case 'words': {
        if (!this.words.length) return;
        const step = Math.min(0.06, 0.7 / this.words.length);
        this.controls = animate(
          this.words,
          { y: ['140%', '0%'] },
          { duration: 1.25, ease: EASE_OUT, delay: stagger(step, { startDelay: delay }) },
        );
        break;
      }
      case 'fade':
        this.controls = animate(el, { opacity: [0, 1] }, { duration: 1.4, ease: EASE_OUT, delay });
        break;
      case 'rise':
        this.controls = animate(
          el,
          { opacity: [0, 1], y: [32, 0] },
          { duration: 1.3, ease: EASE_OUT, delay },
        );
        break;
      case 'rule':
        this.controls = animate(el, { scaleX: [0, 1] }, { duration: 1.6, ease: EASE_OUT, delay });
        break;
      case 'clip':
        this.controls = animate(
          el,
          { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] },
          { duration: 1.5, ease: EASE_OUT, delay },
        );
        break;
    }
  }
}
