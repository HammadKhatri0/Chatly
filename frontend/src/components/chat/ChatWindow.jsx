import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { ArrowLeft, Info, MessageSquare, Search, X } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { EmptyState, Loading } from '../ui/Feedback.jsx';
import MessageBubble from './MessageBubble.jsx';
import MessageComposer from './MessageComposer.jsx';
import ConversationInfo from './ConversationInfo.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { messageApi } from '../../api/index.js';
import {
  conversationAvatar,
  conversationTitle,
  dayLabel,
  otherMember,
  relativeStamp,
} from '../../utils/format.js';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import gsap, { DURATION, EASE, fadeUp, prefersReducedMotion } from '../../animations/motion.js';

/** Groups messages by calendar day so the thread can show date separators. */
const groupByDay = (messages) =>
  messages.reduce((groups, message) => {
    const label = dayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(message);
    else groups.push({ label, items: [message] });
    return groups;
  }, []);

const ChatWindow = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { activeConversation, messages, loadingMessages, sendMessage, setMessages, emitTyping, typing } =
    useChat();

  const [showInfo, setShowInfo] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState([]);
  const [highlighted, setHighlighted] = useState(params.get('m'));
  const bottomRef = useRef(null);
  const headerRef = useRef(null);
  const searchPanelRef = useRef(null);
  const typingTimer = useRef(null);
  const debounced = useDebouncedValue(term, 300);

  const conversation = activeConversation;
  const title = conversationTitle(conversation, user?._id);
  const peer = conversation && !conversation.isGroup ? otherMember(conversation, user?._id) : null;
  const groups = useMemo(() => groupByDay(messages), [messages]);
  const typingUserId = conversation ? typing[conversation._id] : null;
  const typingName = conversation?.members?.find((m) => String(m._id) === String(typingUserId))?.name;

  // Header re-introduces itself when you switch chats, which signals the context change.
  useGSAP(
    () => {
      if (headerRef.current) fadeUp(headerRef.current, { distance: 10 });
    },
    { dependencies: [conversation?._id] }
  );

  useGSAP(
    () => {
      if (!searchOpen || !searchPanelRef.current || prefersReducedMotion()) return;
      gsap.fromTo(
        searchPanelRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: DURATION.fast, ease: EASE.out }
      );
    },
    { dependencies: [searchOpen] }
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 30 ? 'auto' : 'smooth' });
  }, [messages.length, conversation?._id, typingUserId]);

  useEffect(() => {
    setSearchOpen(false);
    setTerm('');
    setShowInfo(false);
  }, [conversation?._id]);

  // Jump to a message opened from a search result.
  useEffect(() => {
    const target = params.get('m');
    if (!target || !messages.length) return undefined;
    const node = document.getElementById(`message-${target}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlighted(target);
    const timer = setTimeout(() => {
      setHighlighted(null);
      params.delete('m');
      setParams(params, { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [params, messages.length]);

  useEffect(() => {
    if (!searchOpen || debounced.trim().length < 2 || !conversation) {
      setHits([]);
      return;
    }
    messageApi
      .search({ q: debounced.trim(), conversationId: conversation._id, limit: 25 })
      .then(({ messages: found }) => setHits(found))
      .catch((error) => toast.error(error.message));
  }, [debounced, searchOpen, conversation?._id]);

  const handleTyping = (isTyping) => {
    if (!conversation) return;
    emitTyping(conversation, isTyping);
    clearTimeout(typingTimer.current);
    if (isTyping) typingTimer.current = setTimeout(() => emitTyping(conversation, false), 2500);
  };

  const removeMessage = async (message) => {
    try {
      await messageApi.remove(message._id);
      setMessages((prev) => prev.filter((item) => item._id !== message._id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const jumpTo = (messageId) => {
    document.getElementById(`message-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlighted(messageId);
    setTimeout(() => setHighlighted(null), 2500);
  };

  if (!conversation) {
    return (
      <section className="chat-canvas hidden flex-1 items-center justify-center md:flex">
        <EmptyState
          icon={MessageSquare}
          title="Pick a conversation"
          description="Select a chat from the inbox, or start a new one from Friends."
        />
      </section>
    );
  }

  return (
    <section className="chat-canvas relative flex h-full min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          ref={headerRef}
          className="glass sticky top-0 z-10 flex items-center gap-3 border-b px-3 py-3 sm:px-5"
        >
          <button
            type="button"
            onClick={() => navigate('/chats')}
            className="press rounded-xl p-2 text-ink-400 hover:bg-ink-50 md:hidden"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar
            src={conversationAvatar(conversation, user?._id)}
            name={title}
            size="md"
            online={conversation.isGroup ? undefined : Boolean(peer?.isOnline)}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">{title}</h1>
            <p className="truncate text-xs text-ink-400">
              {typingUserId
                ? 'typing…'
                : conversation.isGroup
                  ? `${conversation.members.length} members, ${conversation.members.filter((m) => m.isOnline).length} online`
                  : peer?.isOnline
                    ? 'Online'
                    : `Last seen ${relativeStamp(peer?.lastSeen)}`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            className="press rounded-xl p-2 text-ink-400 hover:bg-ink-50 hover:text-brand-600"
            aria-label="Search in conversation"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowInfo((value) => !value)}
            className="press rounded-xl p-2 text-ink-400 hover:bg-ink-50 hover:text-brand-600"
            aria-label="Conversation details"
          >
            <Info className="h-5 w-5" />
          </button>
        </header>

        {searchOpen && (
          <div ref={searchPanelRef} className="overflow-hidden border-b border-ink-100 bg-panel">
            <div className="px-3 py-3 sm:px-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  autoFocus
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder={`Search in ${title}`}
                  className="input pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setTerm('');
                  }}
                  className="press absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:bg-ink-100"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {Boolean(hits.length) && (
                <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                  {hits.map((hit) => (
                    <button
                      key={hit._id}
                      type="button"
                      onClick={() => jumpTo(hit._id)}
                      className="press block w-full rounded-lg px-3 py-2 text-left hover:bg-ink-50"
                    >
                      <span className="flex justify-between gap-2 text-[11px] text-ink-400">
                        <span className="font-medium text-ink-600">{hit.sender?.name}</span>
                        {relativeStamp(hit.createdAt)}
                      </span>
                      <span className="block truncate text-sm text-ink-800">{hit.text}</span>
                    </button>
                  ))}
                </div>
              )}
              {debounced.trim().length >= 2 && !hits.length && (
                <p className="mt-2 px-1 text-xs text-ink-400">No messages match “{debounced.trim()}”.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-6">
          {loadingMessages ? (
            <Loading label="Loading messages…" />
          ) : messages.length ? (
            groups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="sticky top-2 z-[5] flex justify-center">
                  <span className="rounded-full bg-panel/90 px-3 py-1 text-[11px] font-medium text-ink-400 shadow-sm ring-1 ring-ink-100/70 backdrop-blur">
                    {group.label}
                  </span>
                </div>
                {group.items.map((message, index) => {
                  const mine = String(message.sender?._id || message.sender) === String(user?._id);
                  const previous = group.items[index - 1];
                  const showAvatar =
                    !previous ||
                    String(previous.sender?._id || previous.sender) !==
                      String(message.sender?._id || message.sender);
                  return (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      mine={mine}
                      isGroup={conversation.isGroup}
                      showAvatar={showAvatar}
                      highlighted={String(highlighted) === String(message._id)}
                      canDelete={mine || isAdmin}
                      onDelete={removeMessage}
                    />
                  );
                })}
              </div>
            ))
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description={`Say hello to ${title}.`}
            />
          )}

          {typingUserId && <TypingIndicator name={typingName} />}
          <div ref={bottomRef} />
        </div>

        <MessageComposer
          conversation={conversation}
          onSend={(payload) => sendMessage(conversation._id, payload)}
          onTyping={handleTyping}
        />
      </div>

      {showInfo && <ConversationInfo conversation={conversation} onClose={() => setShowInfo(false)} />}
    </section>
  );
};

export default ChatWindow;
