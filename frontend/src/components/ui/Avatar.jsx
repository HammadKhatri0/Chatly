import clsx from 'clsx';
import { assetUrl, initials } from '../../utils/format.js';

const SIZES = {
  xs: 'h-8 w-8 text-[11px]',
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const DOT = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
};

/**
 * Six fallback gradients. Picking by name hash means the same person keeps the
 * same colour everywhere, so a wall of initials still reads as distinct people.
 */
const TINTS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
];

const tintFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
};

const Avatar = ({ src, name = '', size = 'sm', online, className, ring = false }) => (
  <span className={clsx('group/avatar relative inline-flex shrink-0', className)}>
    {src ? (
      <img
        src={assetUrl(src)}
        alt={name}
        className={clsx(
          SIZES[size],
          'rounded-full object-cover shadow-soft ring-1 ring-black/5 transition duration-300 group-hover/avatar:scale-105',
          ring && 'ring-2 ring-panel'
        )}
      />
    ) : (
      <span
        className={clsx(
          SIZES[size],
          'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-soft',
          'transition duration-300 group-hover/avatar:scale-105',
          tintFor(name),
          ring && 'ring-2 ring-panel'
        )}
      >
        {initials(name) || '?'}
      </span>
    )}

    {online !== undefined && (
      <span className={clsx('absolute bottom-0 right-0 grid place-items-center', DOT[size])}>
        {/* The halo only plays while the person is actually online. */}
        {online && (
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-500" />
        )}
        <span
          className={clsx(
            'relative h-full w-full rounded-full border-2 border-panel',
            online ? 'bg-emerald-500' : 'bg-ink-400'
          )}
        />
      </span>
    )}
  </span>
);

export default Avatar;
