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

/**
 * The gate every entrance animation checks.
 *
 * A background tab pauses requestAnimationFrame, which freezes a tween on its
 * `from` values — so anything starting at `opacity: 0` would stay invisible
 * until the tab is focused. Opening the app in a background tab would show a
 * blank page. When the document is hidden we skip the animation and render the
 * end state directly.
 */
export const skipMotion = () =>
  prefersReducedMotion() || (typeof document !== 'undefined' && document.hidden);

const settle = (targets, vars = {}) => {
  const { opacity = 1, x = 0, y = 0, scale = 1 } = vars;
  gsap.set(targets, { opacity, x, y, scale, clearProps: 'transform' });
  return gsap.timeline();
};

export const fadeUp = (targets, { delay = 0, stagger = 0, distance = 14, duration = DURATION.base } = {}) => {
  if (!targets || skipMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, y: distance },
    { opacity: 1, y: 0, duration, delay, stagger, ease: EASE.out, clearProps: 'transform' }
  );
};

export const fadeIn = (targets, { delay = 0, duration = DURATION.base } = {}) => {
  if (!targets || skipMotion()) return settle(targets);
  return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration, delay, ease: EASE.out });
};

export const slideInX = (targets, { from = -20, delay = 0, stagger = 0 } = {}) => {
  if (!targets || skipMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, x: from },
    { opacity: 1, x: 0, duration: DURATION.base, delay, stagger, ease: EASE.out, clearProps: 'transform' }
  );
};

/** Bubbles and badges: a small overshoot reads as "this just arrived". */
export const popIn = (targets, { delay = 0, from = 0.85, duration = DURATION.fast } = {}) => {
  if (!targets || skipMotion()) return settle(targets);
  return gsap.fromTo(
    targets,
    { opacity: 0, scale: from },
    { opacity: 1, scale: 1, duration, delay, ease: EASE.pop, clearProps: 'transform' }
  );
};

export const messageIn = (target, { mine = false } = {}) => {
  if (!target || skipMotion()) return settle(target);
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
  if (skipMotion()) {
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
  if (!targets || skipMotion()) return null;
  return gsap.to(targets, {
    y: -distance,
    duration,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  });
};

export const typingDots = (targets) => {
  if (!targets || skipMotion()) return null;
  return gsap.to(targets, {
    y: -4,
    duration: 0.34,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    stagger: 0.12,
  });
};

/* ------------------------------------------------------------------ *
 * Interaction motion: everything above plays on entry, everything     *
 * below plays in response to the pointer.                             *
 * ------------------------------------------------------------------ */

/**
 * Pulls an element a little way toward the cursor while it is hovered.
 * Returns a cleanup function; callers must invoke it on unmount.
 */
export const magnetic = (node, { strength = 0.28, max = 10 } = {}) => {
  if (!node || skipMotion()) return () => {};

  const quickX = gsap.quickTo(node, 'x', { duration: 0.4, ease: EASE.out });
  const quickY = gsap.quickTo(node, 'y', { duration: 0.4, ease: EASE.out });

  const onMove = (event) => {
    const box = node.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    quickX(gsap.utils.clamp(-max, max, dx * strength));
    quickY(gsap.utils.clamp(-max, max, dy * strength));
  };
  const onLeave = () => {
    quickX(0);
    quickY(0);
  };

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerleave', onLeave);
  return () => {
    node.removeEventListener('pointermove', onMove);
    node.removeEventListener('pointerleave', onLeave);
    gsap.killTweensOf(node);
  };
};

/** Subtle 3D tilt toward the cursor. Used on cards big enough to carry it. */
export const tilt = (node, { max = 6, scale = 1.012 } = {}) => {
  if (!node || skipMotion()) return () => {};

  gsap.set(node, { transformPerspective: 900, transformStyle: 'preserve-3d' });
  const rotX = gsap.quickTo(node, 'rotationX', { duration: 0.5, ease: EASE.out });
  const rotY = gsap.quickTo(node, 'rotationY', { duration: 0.5, ease: EASE.out });

  const onMove = (event) => {
    const box = node.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    rotY(px * max * 2);
    rotX(-py * max * 2);
  };
  const onEnter = () => gsap.to(node, { scale, duration: DURATION.fast, ease: EASE.out });
  const onLeave = () => {
    rotX(0);
    rotY(0);
    gsap.to(node, { scale: 1, duration: DURATION.base, ease: EASE.out });
  };

  node.addEventListener('pointermove', onMove);
  node.addEventListener('pointerenter', onEnter);
  node.addEventListener('pointerleave', onLeave);
  return () => {
    node.removeEventListener('pointermove', onMove);
    node.removeEventListener('pointerenter', onEnter);
    node.removeEventListener('pointerleave', onLeave);
    gsap.killTweensOf(node);
  };
};

/** Ink ripple from the click point. The span removes itself when the tween ends. */
export const ripple = (event, node) => {
  if (!node || skipMotion()) return;
  const box = node.getBoundingClientRect();
  const size = Math.max(box.width, box.height) * 2;
  const dot = document.createElement('span');

  dot.setAttribute('aria-hidden', 'true');
  Object.assign(dot.style, {
    position: 'absolute',
    left: `${event.clientX - box.left - size / 2}px`,
    top: `${event.clientY - box.top - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    background: 'currentColor',
    opacity: '0.28',
    pointerEvents: 'none',
    transform: 'scale(0)',
  });
  node.appendChild(dot);

  gsap.to(dot, {
    scale: 1,
    opacity: 0,
    duration: 0.62,
    ease: 'power2.out',
    onComplete: () => dot.remove(),
  });
};

/** Short horizontal shake — form errors, rejected actions. */
export const shake = (target) => {
  if (!target || skipMotion()) return null;
  return gsap.fromTo(
    target,
    { x: -8 },
    { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' }
  );
};

/** One-shot attention pulse for a value that just changed. */
export const pulse = (target, { scale = 1.12 } = {}) => {
  if (!target || skipMotion()) return null;
  return gsap.fromTo(
    target,
    { scale: 1 },
    { scale, duration: 0.14, yoyo: true, repeat: 1, ease: EASE.inOut, clearProps: 'transform' }
  );
};

/** Reveals elements as they scroll into their container. */
export const revealOnScroll = (items, root) => {
  if (!items?.length || skipMotion()) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        fadeUp(entry.target, { distance: 18 });
        observer.unobserve(entry.target);
      });
    },
    { root: root || null, threshold: 0.15 }
  );

  items.forEach((item) => {
    gsap.set(item, { opacity: 0 });
    observer.observe(item);
  });
  return () => observer.disconnect();
};

export default gsap;
