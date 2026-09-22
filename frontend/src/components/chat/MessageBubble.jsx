import clsx from 'clsx';
import { Download, FileText, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { assetUrl, fileSize, timeOnly } from '../../utils/format.js';

const Attachment = ({ message, mine }) => {
  const { attachment, type } = message;
  if (!attachment) return null;
  const url = assetUrl(attachment.url);

  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
        <img src={url} alt={attachment.name} className="max-h-72 w-full object-cover" />
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

const MessageBubble = ({ message, mine, showAvatar, isGroup, highlighted, canDelete, onDelete }) => (
  <div
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
        'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm transition sm:max-w-[65%]',
        mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink-800',
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
        className="invisible rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 group-hover:visible"
        aria-label="Delete message"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )}
  </div>
);

export default MessageBubble;
