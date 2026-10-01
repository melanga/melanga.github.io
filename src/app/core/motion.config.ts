import type { ValueAnimationTransition } from 'motion';

/** Expo-out: the house easing — fast start, long silky settle. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.76, 0, 0.24, 1];

export const POPUP_SPRING: ValueAnimationTransition<number> = {
  type: 'spring',
  stiffness: 210,
  damping: 26,
  mass: 1,
};

export const REDUCED_MOTION_TRANSITION: ValueAnimationTransition<number> = {
  duration: 0.01,
};

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function prefersReducedMotion(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** True for mouse/trackpad users — the custom cursor and magnetic effects only run there. */
export function hasFinePointer(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch {
    return false;
  }
}

export function resolveTransition(
  spring: ValueAnimationTransition<number>,
): ValueAnimationTransition<number> {
  return prefersReducedMotion() ? REDUCED_MOTION_TRANSITION : spring;
}

export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent lerp factor: `damp(0.1, dt)` behaves like 0.1 per 60fps frame. */
export const damp = (factor: number, dtMs: number): number =>
  1 - Math.pow(1 - factor, dtMs / (1000 / 60));
