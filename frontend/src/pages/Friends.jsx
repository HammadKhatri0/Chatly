import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ArrowLeft, Check, MessageSquare, Search, UserMinus, UserPlus, UsersRound, X } from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import { Badge, EmptyState, Loading } from '../components/ui/Feedback.jsx';
import { friendApi, userApi } from '../api/index.js';

import { useChat } from '../context/ChatContext.jsx';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { useStaggerChildren } from '../hooks/useMotion.js';

const TABS = [
  { key: 'friends', label: 'My friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'discover', label: 'Find people' },
];

const PersonRow = ({ person, children }) => (
  <div className="hover-lift group flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 hover:border-brand-300/60">
    <Avatar src={person.avatar} name={person.name} size="md" online={person.isOnline} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-ink-900">{person.name}</p>
      <p className="truncate text-xs text-ink-400">{person.email}</p>
    </div>
    {/* Actions stay out of the way until the row is hovered or focused. */}
    <div className="flex shrink-0 flex-wrap justify-end gap-2 transition-opacity duration-200 sm:opacity-70 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      {children}
    </div>
  </div>
);

const Friends = () => {
  const navigate = useNavigate();

  const { friends, requests, refreshFriends, startDirectChat, openConversation } = useChat();

  const [tab, setTab] = useState('friends');
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const debounced = useDebouncedValue(term, 350);

  useEffect(() => {
    if (tab !== 'discover') return;
    setSearching(true);
    userApi
      .search({ q: debounced.trim(), limit: 25 })
      .then(({ users }) => setResults(users))
      .catch((error) => toast.error(error.message))
      .finally(() => setSearching(false));
  }, [debounced, tab]);

  const openChatWith = async (personId) => {
    setBusyId(personId);
    try {
      const conversation = await startDirectChat(personId);
      openConversation(conversation._id);
      navigate(`/chats/${conversation._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const run = async (action, personId, successMessage) => {
    setBusyId(personId);
    try {
      await action();
      await refreshFriends();
      if (tab === 'discover') {
        const { users } = await userApi.search({ q: debounced.trim(), limit: 25 });
        setResults(users);
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const filteredFriends = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (tab !== 'friends' || !query) return friends;
    return friends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) || friend.email.toLowerCase().includes(query)
    );
  }, [friends, term, tab]);

  const listRef = useStaggerChildren(
    [tab, filteredFriends.length, results.length, requests.incoming.length],
    { stagger: 0.04 }
  );

  return (
    <div className="chat-canvas flex h-full w-full flex-col overflow-hidden">
      <header className="glass sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-4">
        <button
          type="button"
          onClick={() => navigate('/chats')}
          className="press rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 md:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-ink-900">Friends</h1>
          <p className="text-xs text-ink-400">
            {friends.length} friends · {requests.incoming.length} pending requests
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={clsx(
              'press flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200',
              tab === item.key
                ? 'bg-brand-gradient text-white shadow-glow'
                : 'border border-line bg-panel text-ink-600 hover:-translate-y-px hover:border-brand-300 hover:text-brand-700 hover:shadow-soft dark:hover:text-brand-300'
            )}
          >
            {item.label}
            {item.key === 'requests' && <Badge
                count={requests.incoming.length}
                className={clsx(tab === item.key && '!bg-white !bg-none !text-brand-700 !shadow-none !ring-0')}
              />}
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={tab === 'discover' ? 'Search everyone by name or email' : 'Search your friends'}
            className="input pl-9"
          />
        </div>
      </div>

      <div ref={listRef} className="scroll-slim flex-1 space-y-2 overflow-y-auto px-4 pb-6">
        {tab === 'friends' &&
          (filteredFriends.length ? (
            filteredFriends.map((friend) => (
              <PersonRow key={friend._id} person={friend}>
                <Button size="sm" variant="secondary" onClick={() => openChatWith(friend._id)} loading={busyId === friend._id}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => run(() => friendApi.unfriend(friend._id), friend._id, 'Friend removed')}
                >
                  <UserMinus className="h-3.5 w-3.5" /> Unfriend
                </Button>
              </PersonRow>
            ))
          ) : (
            <EmptyState
              icon={UsersRound}
              title="No friends yet"
              description="Use Find people to search the directory and send a request."
            />
          ))}

        {tab === 'requests' && (
          <div className="space-y-5">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Incoming ({requests.incoming.length})
              </h2>
              {requests.incoming.length ? (
                requests.incoming.map((request) => (
                  <PersonRow key={request._id} person={request.from}>
                    <Button
                      size="sm"
                      onClick={() => run(() => friendApi.respond(request._id, 'accept'), request._id, 'Request accepted')}
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => run(() => friendApi.respond(request._id, 'reject'), request._id, 'Request rejected')}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </PersonRow>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-line bg-panel/40 p-6 text-center text-sm text-ink-400">
                  No incoming requests.
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Sent ({requests.outgoing.length})
              </h2>
              {requests.outgoing.length ? (
                requests.outgoing.map((request) => (
                  <PersonRow key={request._id} person={request.to}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => run(() => friendApi.cancel(request._id), request._id, 'Request cancelled')}
                    >
                      Cancel
                    </Button>
                  </PersonRow>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-line bg-panel/40 p-6 text-center text-sm text-ink-400">
                  No pending sent requests.
                </p>
              )}
            </section>
          </div>
        )}

        {tab === 'discover' &&
          (searching ? (
            <Loading label="Searching…" />
          ) : results.length ? (
            results.map((person) => (
              <PersonRow key={person._id} person={person}>
                <Button size="sm" variant="secondary" onClick={() => openChatWith(person._id)} loading={busyId === person._id}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                {person.relation === 'none' && (
                  <Button
                    size="sm"
                    onClick={() => run(() => friendApi.send(person._id), person._id, 'Request sent')}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Add friend
                  </Button>
                )}
                {person.relation === 'request_sent' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run(() => friendApi.cancel(person.requestId), person._id, 'Request cancelled')}
                  >
                    Requested
                  </Button>
                )}
                {person.relation === 'request_received' && (
                  <Button
                    size="sm"
                    onClick={() => run(() => friendApi.respond(person.requestId, 'accept'), person._id, 'Now friends')}
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </Button>
                )}
                {person.relation === 'friends' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => run(() => friendApi.unfriend(person._id), person._id, 'Friend removed')}
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Unfriend
                  </Button>
                )}
              </PersonRow>
            ))
          ) : (
            <EmptyState
              icon={Search}
              title="No people found"
              description={`Nobody matches “${term}”. Try another name or email.`}
            />
          ))}
      </div>
    </div>
  );
};

export default Friends;
