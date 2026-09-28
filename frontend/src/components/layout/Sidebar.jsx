import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import clsx from 'clsx';
import {
  Archive,
  LogOut,
  MessageSquare,
  Search,
  Shield,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { Badge, EmptyState, SkeletonList } from '../ui/Feedback.jsx';
import ConversationItem from '../chat/ConversationItem.jsx';
import NewGroupModal from '../chat/NewGroupModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { messageApi } from '../../api/index.js';
import { conversationTitle, relativeStamp } from '../../utils/format.js';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { useStaggerChildren } from '../../hooks/useMotion.js';
import gsap, { DURATION, EASE, skipMotion, slideInX } from '../../animations/motion.js';

const NavButton = ({ icon: Icon, label, active, badge, onClick, innerRef }) => (
  <button
    ref={innerRef}
    type="button"
    onClick={onClick}
    className={clsx(
      'press group relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
      'transition-colors duration-200',
      active ? 'text-white' : 'text-ink-400 hover:bg-ink-100/60 hover:text-ink-800'
    )}
  >
    <span className="relative">
      <Icon
        className={clsx(
          'h-5 w-5 transition-transform duration-300',
          active ? 'scale-110' : 'group-hover:-translate-y-0.5'
        )}
      />
      {Boolean(badge) && (
        <Badge
          count={badge}
          className={clsx(
            'absolute -right-2.5 -top-2',
            // On the active pill the badge inverts: white chip, brand numerals.
            active && '!bg-white !bg-none !text-brand-700 !shadow-none !ring-0'
          )}
        />
      )}
    </span>
    {label}
  </button>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const {
    recent,
    archived,
    loadingConversations,
    activeId,
    openConversation,
    totalUnread,
    archivedUnread,
    requests,
  } = useChat();

  const [term, setTerm] = useState('');
  const [groupOpen, setGroupOpen] = useState(false);
  const [messageHits, setMessageHits] = useState([]);
  const debounced = useDebouncedValue(term, 350);

  const navRef = useRef(null);
  const pillRef = useRef(null);
  const searchRef = useRef(null);
  const tabRefs = useRef({});

  const onArchive = pathname.startsWith('/archive');
  const list = onArchive ? archived : recent;

  const filtered = useMemo(() => {
    const query = debounced.trim().toLowerCase();
    if (!query) return list;
    // While searching, look through every chat rather than just the visible inbox.
    return [...recent, ...archived].filter((conversation) =>
      conversationTitle(conversation, user?._id).toLowerCase().includes(query)
    );
  }, [debounced, list, recent, archived, user?._id]);

  const listRef = useStaggerChildren([filtered.length, onArchive, debounced], { stagger: 0.035 });

  const activeTab = pathname.startsWith('/friends')
    ? 'friends'
    : pathname.startsWith('/profile')
      ? 'profile'
      : pathname.startsWith('/admin')
        ? 'admin'
        : onArchive
          ? 'archive'
          : 'chats';

  // A single pill glides between nav items instead of each one flashing its own background.
  useGSAP(
    () => {
      const target = tabRefs.current[activeTab];
      const pill = pillRef.current;
      if (!target || !pill) return;

      const box = { x: target.offsetLeft, y: target.offsetTop, w: target.offsetWidth, h: target.offsetHeight };
      const vars = { x: box.x, y: box.y, width: box.w, height: box.h, autoAlpha: 1 };

      if (skipMotion() || !pill.dataset.placed) {
        gsap.set(pill, vars);
        pill.dataset.placed = 'true';
        return;
      }
      gsap.to(pill, { ...vars, duration: DURATION.base, ease: EASE.out });
    },
    { scope: navRef, dependencies: [activeTab, isAdmin] }
  );

  useGSAP(() => {
    const items = navRef.current?.querySelectorAll('button');
    if (items?.length) slideInX(items, { from: -10, stagger: 0.04 });
  }, {});

  // "/" focuses the inbox search from anywhere, the way most chat clients do it.
  useEffect(() => {
    const onKeyDown = (event) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(event.target?.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setTerm('');
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const query = debounced.trim();
    if (query.length < 2) {
      setMessageHits([]);
      return;
    }
    messageApi
      .search({ q: query, limit: 8 })
      .then(({ messages }) => setMessageHits(messages))
      .catch(() => setMessageHits([]));
  }, [debounced]);

  const select = (conversation) => {
    openConversation(conversation._id);
    navigate(`/chats/${conversation._id}`);
  };

  const inboxCount = filtered.length;

  return (
    <aside className="relative flex h-full w-full flex-col border-r border-line bg-panel md:w-[340px] md:shrink-0">
      {/* Brand wash behind the header, so the column has a top rather than just starting. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-500/[0.09] to-transparent"
      />

      <header className="relative flex items-center gap-2 px-3 pb-3 pt-4">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="press group flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 text-left transition hover:bg-ink-100/60"
        >
          <Avatar src={user?.avatar} name={user?.name} size="md" online />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink-900">{user?.name}</span>
            <span className="block truncate text-xs text-ink-400 transition-colors group-hover:text-brand-500">
              {user?.email}
            </span>
          </span>
        </button>
        <ThemeToggle />
        <button
          type="button"
          onClick={logout}
          title="Log out"
          className="press rounded-xl p-2 text-ink-400 transition hover:bg-rose-500/10 hover:text-rose-500"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <nav ref={navRef} className="relative flex items-stretch gap-1 px-3 pb-3">
        <span
          ref={pillRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-0 top-0 rounded-xl bg-brand-gradient shadow-glow"
        />
        <NavButton
          innerRef={(node) => {
            tabRefs.current.chats = node;
          }}
          icon={MessageSquare}
          label="Chats"
          badge={totalUnread - archivedUnread}
          active={activeTab === 'chats'}
          onClick={() => navigate('/chats')}
        />
        <NavButton
          innerRef={(node) => {
            tabRefs.current.archive = node;
          }}
          icon={Archive}
          label="Archive"
          badge={archivedUnread}
          active={activeTab === 'archive'}
          onClick={() => navigate('/archive')}
        />
        <NavButton
          innerRef={(node) => {
            tabRefs.current.friends = node;
          }}
          icon={UsersRound}
          label="Friends"
          badge={requests.incoming.length}
          active={activeTab === 'friends'}
          onClick={() => navigate('/friends')}
        />
        <NavButton
          innerRef={(node) => {
            tabRefs.current.profile = node;
          }}
          icon={UserRound}
          label="Profile"
          active={activeTab === 'profile'}
          onClick={() => navigate('/profile')}
        />
        {isAdmin && (
          <NavButton
            innerRef={(node) => {
              tabRefs.current.admin = node;
            }}
            icon={Shield}
            label="Admin"
            active={activeTab === 'admin'}
            onClick={() => navigate('/admin')}
          />
        )}
      </nav>

      <div className="relative px-4 pb-3">
        <div className="group relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition-colors group-focus-within:text-brand-500" />
          <input
            ref={searchRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search chats and messages"
            className="input pl-9 pr-10"
          />
          {term ? (
            <button
              type="button"
              onClick={() => setTerm('')}
              className="press absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-ink-400 sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="relative flex items-center justify-between px-5 pb-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
          {debounced ? 'Search results' : onArchive ? 'Archived' : 'Inbox'}
          {!loadingConversations && Boolean(inboxCount) && (
            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] tabular-nums text-ink-600">
              {inboxCount}
            </span>
          )}
        </h2>
        <Button size="sm" variant="secondary" onClick={() => setGroupOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" /> Group
        </Button>
      </div>

      <div className="scroll-slim relative flex-1 overflow-y-auto px-3 pb-4">
        {loadingConversations && <SkeletonList rows={7} />}

        <div ref={listRef} className="space-y-1">
          {!loadingConversations &&
            filtered.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                currentUserId={user?._id}
                active={String(activeId) === String(conversation._id)}
                onSelect={select}
              />
            ))}
        </div>

        {!loadingConversations && !filtered.length && debounced.trim() && (
          <p className="px-3 py-4 text-sm text-ink-400">No chat names match “{debounced.trim()}”.</p>
        )}

        {!loadingConversations && !filtered.length && !debounced.trim() && (
          <EmptyState
            icon={MessageSquare}
            title={onArchive ? 'Archive is empty' : 'No chats yet'}
            description={
              onArchive
                ? 'Chats move here once you have more than 10 conversations.'
                : 'Find people in Friends and start a conversation.'
            }
          />
        )}

        {Boolean(messageHits.length) && (
          <div className="mt-4 border-t border-line pt-3">
            <h3 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
              Messages
            </h3>
            {messageHits.map((hit) => (
              <button
                key={hit._id}
                type="button"
                onClick={() => {
                  openConversation(hit.conversation._id);
                  navigate(`/chats/${hit.conversation._id}?m=${hit._id}`);
                }}
                className="press block w-full rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-line hover:bg-ink-100/50"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-ink-800">
                    {conversationTitle(hit.conversation, user?._id)}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-400">{relativeStamp(hit.createdAt)}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-400">
                  {hit.sender?.name}: {hit.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <NewGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} />
    </aside>
  );
};

export default Sidebar;
