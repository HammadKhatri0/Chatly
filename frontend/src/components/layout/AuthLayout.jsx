import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { MessagesSquare } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import gsap, { EASE, fadeUp, popIn, prefersReducedMotion } from '../../animations/motion.js';

/**
 * Shared shell for sign in / sign up: a slowly drifting aurora backdrop with the
 * card and its fields easing in on top.
 */
const AuthLayout = ({ title, subtitle, children, footer }) => {
  const scope = useRef(null);
  const auroraRef = useRef(null);

  useGSAP(
    () => {
      popIn(scope.current?.querySelector('[data-auth-logo]'), { from: 0.6, duration: 0.5 });
      fadeUp(scope.current?.querySelectorAll('[data-auth-head]'), { stagger: 0.07, delay: 0.05 });
      fadeUp(scope.current?.querySelectorAll('[data-auth-field]'), { stagger: 0.06, delay: 0.12 });

      if (prefersReducedMotion() || !auroraRef.current) return;
      gsap.to(auroraRef.current, {
        scale: 1.15,
        xPercent: 4,
        yPercent: -3,
        duration: 14,
        ease: EASE.inOut,
        repeat: -1,
        yoyo: true,
      });
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative flex min-h-full items-center justify-center overflow-hidden p-4">
      <div ref={auroraRef} aria-hidden="true" className="aurora absolute inset-0 -z-10 opacity-70" />
      <div className="absolute inset-0 -z-10 bg-ink-50/50 backdrop-blur-3xl" />

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md p-7 shadow-xl shadow-brand-900/10">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span
            data-auth-logo
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30"
          >
            <MessagesSquare className="h-6 w-6" />
          </span>
          <h1 data-auth-head className="text-2xl font-semibold text-ink-900">
            {title}
          </h1>
          <p data-auth-head className="text-sm text-ink-400">
            {subtitle}
          </p>
        </div>

        {children}

        {footer && <p className="mt-5 text-center text-sm text-ink-400">{footer}</p>}
      </div>
    </div>
  );
};

export default AuthLayout;
