import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ className }) => (
  <Loader2 className={clsx('h-5 w-5 animate-spin text-brand-500', className)} />
);

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-sm text-ink-400">
    <Spinner />
    {label}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
    {Icon && (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" />
      </span>
    )}
    <h3 className="text-base font-semibold text-ink-800">{title}</h3>
    {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
    {action}
  </div>
);

export const Badge = ({ count, className }) => {
  if (!count) return null;
  return (
    <span
      className={clsx(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
