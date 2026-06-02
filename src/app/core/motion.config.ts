import type { ValueAnimationTransition } from 'motion';

export const POPUP_SPRING: ValueAnimationTransition<number> = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 1,
};

export const ENTRANCE_SPRING: ValueAnimationTransition<number> = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

export const HOVER_SPRING: ValueAnimationTransition<number> = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 0.8,
};

export const REDUCED_MOTION_TRANSITION: ValueAnimationTransition<number> = {
  duration: 0.01,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function resolveTransition(
  spring: ValueAnimationTransition<number>,
): ValueAnimationTransition<number> {
  return prefersReducedMotion() ? REDUCED_MOTION_TRANSITION : spring;
}
