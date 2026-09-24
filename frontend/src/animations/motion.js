import gsap from 'gsap';

/**
 * Central motion vocabulary. Components describe intent ("fade this list in")
 * and this module owns the durations, easings and accessibility fallback, so
 * timings stay consistent everywhere and can be retuned in one place.
 */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  pop: 'back.out(1.7)',
};

export const DURATION = {
  fast: 0.25,
  base: 0.4,
  slow: 0.7,
};

/** Users who ask for less motion get the end state immediately, never a jump. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const settle = (targets, vars = {}) => {
  const { opacity = 1, x = 0, y = 0, scale = 1 } = vars;
  gsap.set(targets, { opacity, x, y, scale, clearProps: 'transform' });
  return gsap.timeline();
};

export const fadeUp = (targets, { delay = 0, stagger = 0, distance = 14, duration = DURATION.base } = {}) => {
  if (!targets || prefersReducedMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, y: distance },
    { opacity: 1, y: 0, duration, delay, stagger, ease: EASE.out, clearProps: 'transform' }
  );
};

export const fadeIn = (targets, { delay = 0, duration = DURATION.base } = {}) => {
  if (!targets || prefersReducedMotion()) return settle(targets);
  return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration, delay, ease: EASE.out });
};

export const slideInX = (targets, { from = -20, delay = 0, stagger = 0 } = {}) => {
  if (!targets || prefersReducedMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, x: from },
    { opacity: 1, x: 0, duration: DURATION.base, delay, stagger, ease: EASE.out, clearProps: 'transform' }
  );
};

/** Bubbles and badges: a small overshoot reads as "this just arrived". */
export const popIn = (targets, { delay = 0, from = 0.85, duration = DURATION.fast } = {}) => {
  if (!targets || prefersReducedMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, scale: from },
    { opacity: 1, scale: 1, duration, delay, ease: EASE.pop, clearProps: 'transform' }
  );
};

export const messageIn = (target, { mine = false } = {}) => {
  if (!target || prefersReducedMotion()) return settle(target);
  return gsap.fromTo(
    target,
    { opacity: 0, y: 16, scale: 0.96, x: mine ? 12 : -12 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      x: 0,
      duration: DURATION.base,
      ease: EASE.out,
      clearProps: 'transform',
    }
  );
};

/** Counts a number up; returns the tween so callers can kill it on unmount. */
export const countUp = (node, value, { duration = DURATION.slow } = {}) => {
  if (!node) return null;
  const target = Number(value) || 0;
  if (prefersReducedMotion()) {
    node.textContent = String(target);
    return null;
  }
  const state = { value: 0 };
  return gsap.to(state, {
    value: target,
    duration,
    ease: EASE.inOut,
    onUpdate: () => {
      node.textContent = String(Math.round(state.value));
    },
  });
};

/** Endless gentle float, used to keep empty states from feeling dead. */
export const float = (targets, { distance = 6, duration = 2.4 } = {}) => {
  if (!targets || prefersReducedMotion()) return null;
  return gsap.to(targets, {
    y: -distance,
    duration,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
};

export const typingDots = (targets) => {
  if (!targets || prefersReducedMotion()) return null;
  return gsap.to(targets, {
    y: -4,
    duration: 0.34,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: 0.12,
  });
};

export default gsap;
