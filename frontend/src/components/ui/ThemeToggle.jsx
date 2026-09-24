import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import gsap, { DURATION, EASE, prefersReducedMotion } from '../../animations/motion.js';

/** Day / night switch: the knob slides and the icons cross-fade as they rotate. */
const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  const knobRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);

  useGSAP(
    () => {
      const duration = prefersReducedMotion() ? 0 : DURATION.base;
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
    },
    { dependencies: [isDark] }
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      title={isDark ? 'Day mode' : 'Night mode'}
      className={clsx(
        'relative inline-flex h-8 w-[3.4rem] shrink-0 items-center rounded-full p-1 transition-colors duration-300',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25',
        isDark ? 'bg-brand-700' : 'bg-ink-100',
        className
      )}
    >
      <span
        ref={knobRef}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-panel shadow-sm"
      >
        <Sun ref={sunRef} className="absolute h-3.5 w-3.5 text-amber-500" />
        <Moon ref={moonRef} className="absolute h-3.5 w-3.5 text-brand-300" />
      </span>
    </button>
  );
};

export default ThemeToggle;
