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

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
        active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-50'
      )}
    >
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
          <span className="shrink-0 text-[11px] text-ink-400">
            {relativeStamp(conversation.lastMessageAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={clsx(
              'truncate text-xs',
              conversation.unreadCount ? 'font-medium text-ink-800' : 'text-ink-400'
            )}
          >
            {fromMe && 'You: '}
            {messagePreview(last)}
          </span>
          <Badge count={conversation.unreadCount} />
        </span>
      </span>
    </button>
  );
};

export default ConversationItem;
