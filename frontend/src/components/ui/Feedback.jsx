import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useFloat, usePopOnIncrease } from '../../hooks/useMotion.js';

export const Spinner = ({ className }) => (
  <Loader2 className={clsx('h-5 w-5 animate-spin text-brand-500', className)} />
);

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-sm text-ink-400">
    <Spinner />
    {label}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  const iconRef = useFloat();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icon && (
        <span
          ref={iconRef}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 text-brand-500 shadow-sm"
        >
          <Icon className="h-7 w-7" />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
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
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white shadow-sm shadow-brand-600/30',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
