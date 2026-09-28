import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import gsap, { DURATION, EASE, skipMotion } from '../../animations/motion.js';

/**
 * Day / night switch: the knob slides, the icons cross-fade as they rotate, and
 * a few stars fade up behind the track once night falls.
 */
const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  const scope = useRef(null);
  const knobRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);
  const starsRef = useRef(null);

  useGSAP(
    () => {
      const duration = skipMotion() ? 0 : DURATION.base;

      gsap.to(knobRef.current, { x: isDark ? 26 : 0, duration, ease: EASE.pop });
      gsap.to(sunRef.current, {
        autoAlpha: isDark ? 0 : 1,
        rotate: isDark ? -90 : 0,
        scale: isDark ? 0.5 : 1,
        duration,
        ease: EASE.out,
      });
      gsap.to(moonRef.current, {
        autoAlpha: isDark ? 1 : 0,
        rotate: isDark ? 0 : 90,
        scale: isDark ? 1 : 0.5,
        duration,
        ease: EASE.out,
      });

      const stars = starsRef.current?.children;
      if (stars?.length) {
        gsap.to(stars, {
          autoAlpha: isDark ? 1 : 0,
          scale: isDark ? 1 : 0.2,
          duration,
          stagger: 0.05,
          ease: EASE.out,
        });
      }
    },
    { scope, dependencies: [isDark] }
  );

  return (
    <button
      ref={scope}
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      title={isDark ? 'Day mode' : 'Night mode'}
      className={clsx(
        'relative inline-flex h-8 w-[3.4rem] shrink-0 items-center overflow-hidden rounded-full p-1',
        'ring-1 ring-inset transition-colors duration-500',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25',
        isDark
          ? 'bg-gradient-to-r from-brand-900 to-brand-700 ring-white/10'
          : 'bg-gradient-to-r from-sky-200 to-amber-100 ring-black/5',
        className
      )}
    >
      <span ref={starsRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute left-2 top-2 h-0.5 w-0.5 rounded-full bg-white opacity-0" />
        <span className="absolute left-4 top-4 h-1 w-1 rounded-full bg-white opacity-0" />
        <span className="absolute left-3 top-5 h-0.5 w-0.5 rounded-full bg-white opacity-0" />
      </span>

      <span
        ref={knobRef}
        className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-panel shadow-soft"
      >
        <Sun ref={sunRef} className="absolute h-3.5 w-3.5 text-amber-500" />
        <Moon ref={moonRef} className="absolute h-3.5 w-3.5 text-brand-300" />
      </span>
    </button>
  );
};

export default ThemeToggle;
