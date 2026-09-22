import clsx from 'clsx';
import { assetUrl, initials } from '../../utils/format.js';

const SIZES = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const Avatar = ({ src, name = '', size = 'sm', online, className, ring = false }) => (
  <span className={clsx('relative inline-flex shrink-0', className)}>
    {src ? (
      <img
        src={assetUrl(src)}
        alt={name}
        className={clsx(SIZES[size], 'rounded-full object-cover', ring && 'ring-2 ring-white')}
      />
    ) : (
      <span
        className={clsx(
          SIZES[size],
          'flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
          ring && 'ring-2 ring-white'
        )}
      >
        {initials(name) || '?'}
      </span>
    )}
    {online !== undefined && (
      <span
        className={clsx(
          'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
          online ? 'bg-emerald-500' : 'bg-ink-400'
        )}
      />
    )}
  </span>
);

export default Avatar;
