import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useFloat, usePopOnIncrease } from '../../hooks/useMotion.js';

export const Spinner = ({ className }) => (
  <Loader2 className={clsx('h-5 w-5 animate-spin text-brand-500', className)} />
);

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-sm text-ink-400">
    <span className="relative flex h-10 w-10 items-center justify-center">
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/40" />
      <Spinner className="h-6 w-6" />
    </span>
    {label}
  </div>
);

/**
 * Shaped placeholders for the inbox and the thread. A skeleton in the layout of
 * the real content makes the wait feel like loading rather than like nothing.
 */
export const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <div className="skeleton h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-2.5 w-2/3" />
    </div>
  </div>
);

export const SkeletonList = ({ rows = 6 }) => (
  <div className="space-y-1" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <SkeletonRow key={index} />
    ))}
  </div>
);

export const SkeletonThread = ({ rows = 5 }) => (
  <div className="space-y-4 px-2 py-4" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => {
      const mine = index % 3 === 2;
      return (
        <div key={index} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
          <div
            className="skeleton h-12 rounded-2xl"
            style={{ width: `${38 + ((index * 13) % 30)}%` }}
          />
        </div>
      );
    })}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  const iconRef = useFloat();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icon && (
        <span ref={iconRef} className="relative mb-1 inline-flex">
          {/* Soft bloom behind the glyph so the empty state has a focal point. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-150 rounded-full bg-brand-500/20 blur-2xl"
          />
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Icon className="h-7 w-7" />
          </span>
        </span>
      )}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>}
      {action}
    </div>
  );
};

/** Unread counter; pops whenever the number grows so new messages catch the eye. */
export const Badge = ({ count, className }) => {
  const ref = usePopOnIncrease(count || 0);
  if (!count) return null;

  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-gradient px-1.5',
        'text-[11px] font-semibold tabular-nums text-white shadow-glow ring-1 ring-white/20',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
