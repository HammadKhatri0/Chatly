import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Lock, MessagesSquare, Mic, Users } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import gsap, { DURATION, EASE, fadeUp, popIn, skipMotion } from '../../animations/motion.js';

const HIGHLIGHTS = [
  { icon: MessagesSquare, title: 'Realtime threads', copy: 'Messages, receipts and typing land the moment they happen.' },
  { icon: Users, title: 'Groups that scale', copy: 'Spin up a group, add friends, share files without leaving the chat.' },
  { icon: Mic, title: 'Voice notes', copy: 'Hold to record when typing is too slow.' },
];

/** A scripted exchange that replays on the hero panel, so the product sells itself. */
const PREVIEW = [
  { from: 'them', name: 'Jasmin', text: 'The new build is live 🎉' },
  { from: 'me', text: 'Just opened it — this looks great' },
  { from: 'them', name: 'Jasmin', text: 'Ship it?' },
];

/**
 * Shared shell for sign in / sign up. On large screens a brand panel carries the
 * pitch and an animated preview; the form sits on a clean surface beside it. On
 * phones the panel drops away and the form floats over the aurora.
 */
const AuthLayout = ({ title, subtitle, children, footer }) => {
  const scope = useRef(null);
  const auroraRef = useRef(null);
  const previewRef = useRef(null);

  useGSAP(
    () => {
      popIn(scope.current?.querySelector('[data-auth-logo]'), { from: 0.6, duration: 0.5 });
      fadeUp(scope.current?.querySelectorAll('[data-auth-head]'), { stagger: 0.07, delay: 0.05 });
      fadeUp(scope.current?.querySelectorAll('[data-auth-field]'), { stagger: 0.06, delay: 0.12 });
      fadeUp(scope.current?.querySelectorAll('[data-hero-item]'), {
        stagger: 0.09,
        delay: 0.2,
        distance: 22,
      });

      if (skipMotion()) return;

      if (auroraRef.current) {
        gsap.to(auroraRef.current, {
          scale: 1.15,
          xPercent: 4,
          yPercent: -3,
          duration: 14,
          ease: EASE.inOut,
          repeat: -1,
          yoyo: true,
        });
      }

      // The preview bubbles arrive one by one, pause, then reset and replay.
      const bubbles = previewRef.current?.querySelectorAll('[data-preview-bubble]');
      if (!bubbles?.length) return;
      const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 0.6 });
      loop
        .fromTo(
          bubbles,
          { opacity: 0, y: 14, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: DURATION.base, stagger: 0.55, ease: EASE.pop }
        )
        .to(bubbles, { opacity: 0, y: -10, duration: 0.35, stagger: 0.06, ease: EASE.inOut }, '+=1.4');
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative flex min-h-full lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Brand panel (large screens only) ---------- */}
      <aside className="grain relative hidden overflow-hidden bg-brand-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
        <div aria-hidden="true" className="grid-lines absolute inset-0 opacity-60" />
        <div
          aria-hidden="true"
          className="absolute -left-24 top-1/4 h-96 w-96 animate-drift rounded-full bg-accent-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 right-0 h-96 w-96 animate-drift rounded-full bg-fuchsia-500/30 blur-3xl [animation-delay:-6s]"
        />

        <div className="relative">
          <span data-hero-item className="inline-flex items-center gap-2.5 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <MessagesSquare className="h-5 w-5" />
            </span>
            Chatly
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 data-hero-item className="font-display text-[2rem] font-bold leading-[1.15] tracking-tight xl:text-4xl">
            Conversations that keep up with you.
          </h2>
          <p data-hero-item className="mt-3.5 text-sm leading-relaxed text-white/75 xl:text-[15px]">
            Chatly is a realtime messenger for friends and teams — groups, files, voice notes and
            presence, all on one screen.
          </p>

          {/* Miniature thread that replays underneath the pitch. */}
          <div ref={previewRef} data-hero-item className="mt-7 space-y-2">
            {PREVIEW.map((line, index) => (
              <div
                key={index}
                data-preview-bubble
                className={line.from === 'me' ? 'flex justify-end' : 'flex justify-start'}
              >
                <span
                  className={
                    line.from === 'me'
                      ? 'max-w-[78%] rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-sm text-brand-800 shadow-lg'
                      : 'max-w-[78%] rounded-2xl rounded-bl-md bg-white/15 px-4 py-2.5 text-sm ring-1 ring-white/20 backdrop-blur'
                  }
                >
                  {line.name && (
                    <span className="mb-0.5 block text-[11px] font-semibold text-white/70">{line.name}</span>
                  )}
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ul className="relative space-y-3.5">
          {HIGHLIGHTS.map(({ icon: Icon, title: heading, copy }) => (
            <li data-hero-item key={heading} className="flex gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{heading}</span>
                <span className="block text-xs leading-relaxed text-white/65 xl:text-[13px]">{copy}</span>
              </span>
            </li>
          ))}
          <li data-hero-item className="flex items-center gap-2 pt-1 text-xs text-white/55">
            <Lock className="h-3.5 w-3.5" /> Sessions are signed and expire on their own.
          </li>
        </ul>
      </aside>

      {/* ---------- Form panel ---------- */}
      <div className="relative flex min-h-full items-center justify-center overflow-hidden p-4 sm:p-8">
        <div ref={auroraRef} aria-hidden="true" className="aurora absolute inset-0 -z-10 opacity-60 lg:opacity-0" />
        <div className="absolute inset-0 -z-10 bg-ink-50/60 backdrop-blur-3xl lg:bg-ink-50 lg:backdrop-blur-none" />
        {/* Keeps the form side from reading as a flat rectangle next to the hero. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden lg:block"
          style={{
            backgroundImage:
              'radial-gradient(42rem 32rem at 20% 0%, rgb(117 81 251 / 0.10), transparent 65%), radial-gradient(38rem 30rem at 100% 100%, rgb(6 182 212 / 0.08), transparent 60%)',
          }}
        />

        <div className="absolute right-5 top-5 z-10">
          <ThemeToggle />
        </div>

        <div className="card w-full max-w-md p-7 shadow-float sm:p-8">
          <div className="mb-7 flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <span
              data-auth-logo
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow lg:hidden"
            >
              <MessagesSquare className="h-6 w-6" />
            </span>
            <h1 data-auth-head className="text-2xl font-bold text-ink-900 sm:text-3xl">
              {title}
            </h1>
            <p data-auth-head className="text-sm text-ink-400">
              {subtitle}
            </p>
          </div>

          {children}

          {footer && <p className="mt-6 text-center text-sm text-ink-400 lg:text-left">{footer}</p>}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
