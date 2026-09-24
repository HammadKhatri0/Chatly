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
        'press relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left',
        active ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : 'hover:bg-ink-50'
      )}
    >
      {/* Accent rail marks the open chat without shouting. */}
      <span
        className={clsx(
          'absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity',
          active ? 'opacity-100' : 'opacity-0'
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
            <span className="truncate text-sm font-semibold text-ink-900">{title}</span>
          </span>
          <span className={clsx('shrink-0 text-[11px]', unread ? 'font-medium text-brand-600' : 'text-ink-400')}>
            {relativeStamp(conversation.lastMessageAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={clsx('truncate text-xs', unread ? 'font-medium text-ink-800' : 'text-ink-400')}>
            {fromMe && 'You: '}
            {messagePreview(last)}
          </span>
          <Badge count={unread} />
        </span>
      </span>
    </button>
  );
};

export default ConversationItem;
