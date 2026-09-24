import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/25 hover:brightness-110 disabled:from-brand-300 disabled:to-brand-300',
  secondary: 'bg-brand-500/10 text-brand-700 dark:text-brand-300 hover:bg-brand-500/20',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100',
  danger: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
  outline: 'border border-ink-100 bg-panel text-ink-600 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={clsx(
      'press inline-flex items-center justify-center gap-2 rounded-xl font-medium',
      'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30',
      'disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export default Button;
