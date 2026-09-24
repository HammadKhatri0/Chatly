import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Download, FileText, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { assetUrl, fileSize, timeOnly } from '../../utils/format.js';
import { messageIn } from '../../animations/motion.js';

const Attachment = ({ message, mine }) => {
  const { attachment, type } = message;
  if (!attachment) return null;
  const url = assetUrl(attachment.url);

  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
        <img
          src={url}
          alt={attachment.name}
          className="max-h-72 w-full object-cover transition duration-300 hover:scale-[1.02]"
        />
      </a>
    );
  }

  if (type === 'audio') {
    return <audio controls src={url} className="w-56 max-w-full" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        'flex items-center gap-3 rounded-xl px-3 py-2 transition',
        mine ? 'bg-white/15 hover:bg-white/25' : 'bg-ink-50 hover:bg-ink-100'
      )}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{attachment.name}</span>
        <span className={clsx('block text-[11px]', mine ? 'text-white/70' : 'text-ink-400')}>
          {fileSize(attachment.size)}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0" />
    </a>
  );
};

const MessageBubble = ({ message, mine, showAvatar, isGroup, highlighted, canDelete, onDelete }) => {
  const ref = useRef(null);
  const animated = useRef(false);

  // Animate once per message, so re-renders (read receipts, presence) stay still.
  useEffect(() => {
    if (animated.current || !ref.current) return;
    animated.current = true;
    messageIn(ref.current, { mine });
  }, [mine]);

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
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm transition-shadow sm:max-w-[65%]',
          mine
            ? 'rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/25'
            : 'rounded-bl-md border border-ink-100/70 bg-panel text-ink-800 shadow-sm',
          highlighted && 'ring-2 ring-amber-400'
        )}
      >
        {!mine && isGroup && showAvatar && (
          <p className="mb-1 text-xs font-semibold text-brand-600">{message.sender?.name}</p>
        )}

        {message.attachment && (
          <div className={clsx(message.text && 'mb-2')}>
            <Attachment message={message} mine={mine} />
          </div>
        )}

        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

        <p className={clsx('mt-1 text-right text-[10px]', mine ? 'text-white/70' : 'text-ink-400')}>
          {timeOnly(message.createdAt)}
        </p>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          className="press invisible rounded-lg p-1.5 text-ink-400 hover:bg-rose-500/10 hover:text-rose-500 group-hover:visible"
          aria-label="Delete message"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
