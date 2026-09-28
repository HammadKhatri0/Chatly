import { useRef } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { ripple } from '../../animations/motion.js';

const VARIANTS = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-px disabled:from-brand-300 disabled:to-brand-300 disabled:shadow-none',
  secondary:
    'bg-brand-500/10 text-brand-700 ring-1 ring-inset ring-brand-500/15 hover:bg-brand-500/[0.18] hover:ring-brand-500/30 dark:text-brand-300',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100',
  danger: 'bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/15 hover:bg-rose-500/20 hover:ring-rose-500/30',
  outline:
    'border border-line bg-panel text-ink-600 hover:-translate-y-px hover:border-brand-300 hover:text-brand-700 hover:shadow-soft dark:hover:text-brand-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
  icon: 'h-10 w-10 p-0',
};

/**
 * Every button confirms the click twice: a ripple from the exact point of
 * contact, and a 3% squash. Primary buttons also catch a light sweep on hover.
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  onClick,
  ...props
}) => {
  const ref = useRef(null);

  const handleClick = (event) => {
    if (!disabled && !loading) ripple(event, ref.current);
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className={clsx(
        'press relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden',
        'rounded-xl font-medium transition duration-200 ease-out',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30',
        'disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 disabled:hover:translate-y-0',
        variant === 'primary' && 'sheen',
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
};

export default Button;
