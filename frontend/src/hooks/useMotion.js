import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import {
  countUp,
  fadeUp,
  float,
  magnetic,
  popIn,
  revealOnScroll,
  tilt,
} from '../animations/motion.js';

/**
 * Animates the direct children of a container whenever `deps` change.
 * useGSAP scopes every tween to the container and reverts them on unmount,
 * so no animation outlives the component that started it.
 */
export const useStaggerChildren = (deps = [], { selector = ':scope > *', stagger = 0.045, distance = 12 } = {}) => {
  const ref = useRef(null);

  useGSAP(
    () => {
      const items = ref.current?.querySelectorAll(selector);
      if (items?.length) fadeUp(items, { stagger, distance });
    },
    { scope: ref, dependencies: deps }
  );

  return ref;
};

/** Fades a panel in on mount and whenever the given key changes (route, tab, chat). */
export const useEnter = (key, { distance = 16 } = {}) => {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (ref.current) fadeUp(ref.current, { distance });
    },
    { scope: ref, dependencies: [key] }
  );

  return ref;
};

/** Pops an element whenever `value` increases — used for unread badges. */
export const usePopOnIncrease = (value) => {
  const ref = useRef(null);
  const previous = useRef(value);

  useEffect(() => {
    if (ref.current && value > previous.current) popIn(ref.current, { from: 0.5 });
    previous.current = value;
  }, [value]);

  return ref;
};

/** Animates a numeric readout from 0 to `value`. */
export const useCountUp = (value) => {
  const ref = useRef(null);

  useEffect(() => {
    const tween = countUp(ref.current, value);
    return () => tween?.kill();
  }, [value]);

  return ref;
};

export const useFloat = () => {
  const ref = useRef(null);

  useEffect(() => {
    const tween = float(ref.current);
    return () => tween?.kill();
  }, []);

  return ref;
};

/** Attaches the magnetic cursor pull to whatever the ref lands on. */
export const useMagnetic = (options) => {
  const ref = useRef(null);

  useEffect(() => magnetic(ref.current, options), []);

  return ref;
};

/** 3D tilt toward the cursor, for cards with enough surface to carry it. */
export const useTilt = (options) => {
  const ref = useRef(null);

  useEffect(() => tilt(ref.current, options), []);

  return ref;
};

/**
 * Fades children in as they scroll into view, rather than all at once on mount.
 * Long lists only animate what the viewer actually reaches.
 */
export const useScrollReveal = (deps = [], { selector = ':scope > *' } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const items = ref.current?.querySelectorAll(selector);
    return revealOnScroll(items ? [...items] : [], ref.current);
  }, deps);

  return ref;
};
