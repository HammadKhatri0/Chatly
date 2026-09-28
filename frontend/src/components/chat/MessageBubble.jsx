import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, CheckCheck, Download, FileText, ImageOff, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { assetUrl, fileSize, timeOnly } from '../../utils/format.js';
import { messageIn } from '../../animations/motion.js';

const Attachment = ({ message, mine }) => {
  const { attachment, type } = message;
  // An upload can outlive its file (local disk wiped, Cloudinary asset removed);
  // show a placeholder rather than the browser's broken-image glyph.
  const [broken, setBroken] = useState(false);
  if (!attachment) return null;
  const url = assetUrl(attachment.url);

  if (type === 'image') {
    if (broken) {
      return (
        <span
          className={clsx(
            'flex items-center gap-2.5 rounded-xl px-3 py-4 text-xs',
            mine ? 'bg-white/15 text-white/80' : 'bg-ink-100/70 text-ink-400'
          )}
        >
          <ImageOff className="h-4 w-4 shrink-0" />
          <span className="truncate">{attachment.name || 'Image'} is no longer available</span>
        </span>
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group/img relative block overflow-hidden rounded-xl ring-1 ring-black/5"
      >
        <img
          src={url}
          alt={attachment.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-72 w-full object-cover transition duration-500 ease-out group-hover/img:scale-[1.04]"
        />
        {/* Only appears on hover, so the photo itself is never dimmed at rest. */}
        <span className="pointer-events-none absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/45 to-transparent p-2 opacity-0 transition duration-300 group-hover/img:opacity-100">
          <span className="rounded-lg bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            Open
          </span>
        </span>
      </a>
    );
  }

  if (type === 'audio') {
    // `color-scheme` is what tints the native player; on a brand bubble it must
    // be dark whatever the app theme is, or a white control lands on purple.
    return (
      <audio
        controls
        src={url}
        className="w-56 max-w-full rounded-lg"
        style={mine ? { colorScheme: 'dark' } : undefined}
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        'group/file flex items-center gap-3 rounded-xl px-3 py-2 transition duration-200',
        mine ? 'bg-white/15 hover:bg-white/25' : 'bg-ink-100/70 hover:bg-ink-100'
      )}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{attachment.name}</span>
        <span className={clsx('block text-[11px]', mine ? 'text-white/70' : 'text-ink-400')}>
          {fileSize(attachment.size)}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/file:translate-y-0.5" />
    </a>
  );
};

const MessageBubble = ({
  message,
  mine,
  showAvatar,
  isGroup,
  highlighted,
  canDelete,
  onDelete,
  currentUserId,
}) => {
  const ref = useRef(null);
  const animated = useRef(false);

  // Animate once per message, so re-renders (read receipts, presence) stay still.
  useEffect(() => {
    if (animated.current || !ref.current) return;
    animated.current = true;
    messageIn(ref.current, { mine });
  }, [mine]);

  // Two ticks once anyone else has opened the thread past this message.
  const readByOther = (message.readBy || []).some(
    (reader) => String(reader?._id || reader) !== String(currentUserId)
  );

  return (
    <div
      ref={ref}
      id={`message-${message._id}`}
      className={clsx('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}
    >
      {!mine && (
        <span className="w-8 shrink-0">
          {showAvatar && <Avatar src={message.sender?.avatar} name={message.sender?.name} size="xs" />}
        </span>
      )}

      <div
        className={clsx(
          'relative max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[65%]',
          'transition-all duration-300 ease-out group-hover:-translate-y-px',
          mine
            ? 'rounded-br-md bg-brand-gradient text-white shadow-soft group-hover:shadow-glow'
            : 'rounded-bl-md border border-line bg-panel text-ink-800 shadow-soft group-hover:shadow-lift',
          highlighted && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent'
        )}
      >
        {!mine && isGroup && showAvatar && (
          <p className="mb-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
            {message.sender?.name}
          </p>
        )}

        {message.attachment && (
          <div className={clsx(message.text && 'mb-2')}>
            <Attachment message={message} mine={mine} />
          </div>
        )}

        {message.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>}

        <p
          className={clsx(
            'mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums',
            mine ? 'text-white/70' : 'text-ink-400'
          )}
        >
          {timeOnly(message.createdAt)}
          {mine &&
            (readByOther ? (
              <CheckCheck className="h-3 w-3 text-accent-300" aria-label="Read" />
            ) : (
              <Check className="h-3 w-3" aria-label="Sent" />
            ))}
        </p>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          className={clsx(
            // Touch devices have no hover, so the control stays visible there.
            'press rounded-lg p-1.5 text-ink-400 transition-all duration-200 sm:opacity-0',
            'hover:bg-rose-500/10 hover:text-rose-500 focus-visible:opacity-100 sm:group-hover:opacity-100',
            mine ? '-order-1 translate-x-1 group-hover:translate-x-0' : '-translate-x-1 group-hover:translate-x-0'
          )}
          aria-label="Delete message"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
