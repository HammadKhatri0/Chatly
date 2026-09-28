import clsx from 'clsx';
import { Users } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { Badge } from '../ui/Feedback.jsx';
import {
  conversationAvatar,
  conversationTitle,
  messagePreview,
  otherMember,
  relativeStamp,
} from '../../utils/format.js';

const ConversationItem = ({ conversation, currentUserId, active, onSelect }) => {
  const title = conversationTitle(conversation, currentUserId);
  const peer = otherMember(conversation, currentUserId);
  const last = conversation.lastMessage;
  const fromMe = last && String(last.sender?._id || last.sender) === String(currentUserId);
  const unread = conversation.unreadCount || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={clsx(
        'press group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left',
        'transition-all duration-200 ease-out',
        active
          ? 'bg-brand-500/10 ring-1 ring-inset ring-brand-500/25'
          : 'hover:translate-x-0.5 hover:bg-ink-100/60'
      )}
    >
      {/* Accent rail marks the open chat without shouting, and previews on hover. */}
      <span
        className={clsx(
          'absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient transition-all duration-300',
          active ? 'h-8 opacity-100' : 'h-4 opacity-0 group-hover:opacity-40'
        )}
      />
      <Avatar
        src={conversationAvatar(conversation, currentUserId)}
        name={title}
        size="md"
        online={conversation.isGroup ? undefined : Boolean(peer?.isOnline)}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {conversation.isGroup && <Users className="h-3.5 w-3.5 shrink-0 text-ink-400" />}
            <span
              className={clsx(
                'truncate text-sm transition-colors',
                unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-900',
                active && 'text-brand-700 dark:text-brand-300'
              )}
            >
              {title}
            </span>
          </span>
          <span
            className={clsx(
              'shrink-0 text-[11px] tabular-nums',
              unread ? 'font-semibold text-brand-600 dark:text-brand-300' : 'text-ink-400'
            )}
          >
            {relativeStamp(conversation.lastMessageAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={clsx('truncate text-xs', unread ? 'font-medium text-ink-800' : 'text-ink-400')}>
            {fromMe && <span className="text-ink-400">You: </span>}
            {messagePreview(last)}
          </span>
          <Badge count={unread} />
        </span>
      </span>
    </button>
  );
};

export default ConversationItem;
