import { isBrowser, prefersReducedMotion } from './motion.config';

const GLYPHS = '▚▞░▒/\\<>_-=+*#%01ΣΔλ';

export interface ScrambleOptions {
  /** Total decode time in ms. */
  readonly duration?: number;
  readonly delay?: number;
  readonly glyphs?: string;
}

const escapeHtml = (c: string): string =>
  c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;

/**
 * Decodes `text` into `el` out of random glyphs — characters resolve
 * left-to-right with jitter, like a signal locking on. Returns a cancel function.
 */
export function scrambleText(el: HTMLElement, text: string, opts: ScrambleOptions = {}): () => void {
  if (!isBrowser() || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    el.textContent = text;
    return () => undefined;
  }

  const duration = opts.duration ?? 900;
  const glyphs = opts.glyphs ?? GLYPHS;
  const chars = [...text];
  const reveals = chars.map((_, i) => {
    const base = (i / Math.max(1, chars.length)) * duration * 0.7;
    return base + Math.random() * duration * 0.3;
  });

  let raf = 0;
  let start = 0;
  let lastSwap = 0;
  let cancelled = false;

  const frame = (now: number): void => {
    if (cancelled) return;
    if (!start) start = now;
    const t = now - start - (opts.delay ?? 0);
    if (t < 0) {
      raf = requestAnimationFrame(frame);
      return;
    }
    // Swap noise glyphs at ~30fps so it reads as flicker rather than blur.
    if (now - lastSwap < 33 && t < duration) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastSwap = now;

    let html = '';
    let done = true;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (t >= reveals[i] || c === ' ') {
        html += escapeHtml(c);
      } else {
        done = false;
        const g = glyphs[(Math.random() * glyphs.length) | 0];
        html += `<span class="scramble-glyph">${escapeHtml(g)}</span>`;
      }
    }
    el.innerHTML = html;
    if (!done) {
      raf = requestAnimationFrame(frame);
    } else {
      el.textContent = text;
    }
  };

  raf = requestAnimationFrame(frame);
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    el.textContent = text;
  };
}
